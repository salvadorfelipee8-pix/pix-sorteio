import { prisma as _prismaType } from '@/lib/prisma'
type PrismaClient = typeof _prismaType
// lib/classes/pagamento-service.ts
// ⚠️ IMPACTO: Alterações aqui afetam CotaService (confirmar) e NotificacaoService (trigger)
// CORRIGIDO: trata erros da API Asaas e expõe mensagens reais

import { AuditoriaService } from './auditoria-service'

const ASAAS_BASE_URL = process.env.ASAAS_ENV === 'production'
  ? 'https://api.asaas.com/v3'
  : 'https://sandbox.asaas.com/api/v3'

const MAX_TENTATIVAS_CPF = 3
const EXPIRACAO_MINUTOS   = 15

export interface CriarPagamentoDTO {
  usuarioId: string
  cpf: string      // CPF como salvo no banco (criptografado para usuários cadastrados)
  cpfRaw: string   // CPF puro para envio ao Asaas
  email: string
  nome: string
  valor: number
  cotaIds: string[]
  sorteioId: string
  ipAddress?: string
}

export interface QrCodeResponse {
  pagamentoId: string
  qrCodePayload: string
  qrCodeImageUrl: string
  valor: number
  expiresAt: Date
}

export class PagamentoService {
  private db: PrismaClient
  private auditoria: AuditoriaService

  constructor(db: PrismaClient, auditoria: AuditoriaService) {
    this.db = db
    this.auditoria = auditoria
  }

  async criarCobrancaPix(dto: CriarPagamentoDTO): Promise<QrCodeResponse> {
    await this.verificarLimiteTentativas(dto.usuarioId)

    const expiresAt = new Date(Date.now() + EXPIRACAO_MINUTOS * 60 * 1000)

    const clienteAsaasId = await this.obterClienteAsaas(dto)

    const cobranca = await this.criarCobrancaAsaas({
      clienteAsaasId,
      valor: dto.valor,
      expiresAt,
      descricao: `SorteioMax — ${dto.cotaIds.length} cota(s)`,
    })

    if (!cobranca?.id) {
      console.error('[Asaas] Resposta inválida ao criar cobrança:', JSON.stringify(cobranca))
      const msg = cobranca?.errors?.[0]?.description ?? 'Erro ao criar cobrança PIX no Asaas'
      throw new Error(msg)
    }

    const qrCode = await this.buscarQrCode(cobranca.id)

    if (!qrCode.payload) {
      console.error('[Asaas] QR Code não retornado para cobrança:', cobranca.id, JSON.stringify(qrCode))
      throw new Error('PIX gerado, mas QR Code ainda não disponível. Tente novamente em alguns segundos.')
    }

    const pagamento = await this.db.pagamento.create({
      data: {
        usuarioId:     dto.usuarioId,
        valor:         dto.valor,
        status:        "PENDENTE" as any,
        provedor:      'asaas',
        provedorId:    cobranca.id,
        qrCodePayload: qrCode.payload,
        qrCodeImageUrl: qrCode.imageUrl,
        expiresAt,
        tentativas:    1,
      },
    })

    await this.auditoria.registrar({
      usuarioId:  dto.usuarioId,
      sorteioId:  dto.sorteioId,
      acao:       'PAGAMENTO_CRIADO',
      entidade:   'Pagamento',
      entidadeId: pagamento.id,
      payload:    { valor: dto.valor, cotaIds: dto.cotaIds },
      ipAddress:  dto.ipAddress,
    })

    return {
      pagamentoId:    pagamento.id,
      qrCodePayload:  qrCode.payload,
      qrCodeImageUrl: qrCode.imageUrl,
      valor:          dto.valor,
      expiresAt,
    }
  }

  async processarWebhook(payload: AsaasWebhookPayload): Promise<void> {
    if (payload.event !== 'PAYMENT_RECEIVED') return

    const pagamento = await this.db.pagamento.findUnique({
      where: { provedorId: payload.payment.id },
    })

    if (!pagamento) {
      console.error('Pagamento não encontrado para webhook:', payload.payment.id)
      return
    }

    if (pagamento.status === "PAGO" as any) return

    await this.db.pagamento.update({
      where: { id: pagamento.id },
      data: {
        status:         "PAGO" as any,
        paidAt:         new Date(),
        webhookPayload: payload as any,
      },
    })

    await this.auditoria.registrar({
      usuarioId:  pagamento.usuarioId,
      acao:       'PAGAMENTO_CONFIRMADO',
      entidade:   'Pagamento',
      entidadeId: pagamento.id,
      payload:    { provedorId: payload.payment.id },
    })
  }

  async verificarStatus(pagamentoId: string): Promise<any> {
    const pagamento = await this.db.pagamento.findUnique({
      where: { id: pagamentoId },
      select: { status: true, expiresAt: true },
    })

    if (!pagamento) throw new Error('Pagamento não encontrado.')

    if (
      pagamento.status === "PENDENTE" as any &&
      pagamento.expiresAt < new Date()
    ) {
      await this.db.pagamento.update({
        where: { id: pagamentoId },
        data: { status: "EXPIRADO" as any },
      })
      return "EXPIRADO" as any
    }

    return pagamento.status
  }

  private async obterClienteAsaas(dto: CriarPagamentoDTO): Promise<string> {
    const res = await fetch(`${ASAAS_BASE_URL}/customers?cpfCnpj=${dto.cpfRaw}`, {
      headers: this.headers(),
    })
    const data = await res.json()

    if (data.data?.length > 0) return data.data[0].id

    const criar = await fetch(`${ASAAS_BASE_URL}/customers`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        name:    dto.nome,
        cpfCnpj: dto.cpfRaw,
        email:   dto.email,
      }),
    })
    const cliente = await criar.json()

    if (!cliente?.id) {
      console.error('[Asaas] Erro ao criar cliente:', JSON.stringify(cliente))
      const msg = cliente?.errors?.[0]?.description ?? 'Erro ao criar cliente no Asaas'
      throw new Error(msg)
    }

    return cliente.id
  }

  private async criarCobrancaAsaas(data: {
    clienteAsaasId: string
    valor: number
    expiresAt: Date
    descricao: string
  }) {
    const res = await fetch(`${ASAAS_BASE_URL}/payments`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        customer:    data.clienteAsaasId,
        billingType: 'PIX',
        value:       data.valor,
        dueDate:     data.expiresAt.toISOString().split('T')[0],
        description: data.descricao,
      }),
    })
    return res.json()
  }

  private async buscarQrCode(cobrancaId: string): Promise<{ payload: string; imageUrl: string }> {
    // O Asaas sandbox pode demorar alguns segundos para gerar o QR Code
    for (let tentativa = 1; tentativa <= 6; tentativa++) {
      const res = await fetch(
        `${ASAAS_BASE_URL}/payments/${cobrancaId}/pixQrCode`,
        { headers: this.headers() }
      )
      const data = await res.json()

      if (data.payload) {
        return { payload: data.payload, imageUrl: data.encodedImage ?? '' }
      }

      if (tentativa < 6) {
        await new Promise(r => setTimeout(r, 1500))
      } else {
        console.error('[Asaas] pixQrCode após 6 tentativas:', JSON.stringify(data))
      }
    }

    throw new Error('QR Code não disponível. Aguarde alguns segundos e tente novamente.')
  }

  private async verificarLimiteTentativas(usuarioId: string): Promise<void> {
    const umaHoraAtras = new Date(Date.now() - 60 * 60 * 1000)
    const count = await this.db.pagamento.count({
      where: {
        usuarioId,
        criadoEm: { gte: umaHoraAtras },
      },
    })

    if (count >= MAX_TENTATIVAS_CPF) {
      throw new Error('Limite de tentativas de pagamento atingido. Aguarde 1 hora.')
    }
  }

  private headers() {
    return {
      'Content-Type': 'application/json',
      'access_token': process.env.ASAAS_API_KEY ?? '',
    }
  }
}

export interface AsaasWebhookPayload {
  event: string
  payment: {
    id: string
    status: string
    value: number
    paymentDate: string
  }
}