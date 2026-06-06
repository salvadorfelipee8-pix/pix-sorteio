import { prisma as _prismaType } from '@/lib/prisma'
type PrismaClient = typeof _prismaType
// lib/classes/pagamento-service.ts
// ⚠️ IMPACTO: Alterações aqui afetam CotaService (confirmar) e NotificacaoService (trigger)

import { AuditoriaService } from './auditoria-service'

const ASAAS_BASE_URL = process.env.ASAAS_ENV === 'production'
  ? 'https://api.asaas.com/v3'
  : 'https://sandbox.asaas.com/api/v3'

const MAX_TENTATIVAS_CPF = 3
const EXPIRACAO_MINUTOS   = 15

export interface CriarPagamentoDTO {
  usuarioId: string
  cpf: string
  email: string
  nome: string
  valor: number
  cotaIds: string[]
  sorteioId: string
  ipAddress?: string
}

export interface QrCodeResponse {
  pagamentoId: string
  qrCodePayload: string   // copia-e-cola
  qrCodeImageUrl: string  // base64 da imagem
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
    // Prevenção de fraude: limite de tentativas por CPF/hora
    await this.verificarLimiteTentativas(dto.cpf)

    const expiresAt = new Date(Date.now() + EXPIRACAO_MINUTOS * 60 * 1000)

    // 1. Criar/buscar cliente no Asaas
    const clienteAsaasId = await this.obterClienteAsaas(dto)

    // 2. Criar cobrança PIX no Asaas
    const cobranca = await this.criarCobrancaAsaas({
      clienteAsaasId,
      valor: dto.valor,
      expiresAt,
      descricao: `SorteioMax — ${dto.cotaIds.length} cota(s)`,
    })

    // 3. Buscar QR Code
    const qrCode = await this.buscarQrCode(cobranca.id)

    // 4. Salvar pagamento no banco
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

  // Chamado pelo webhook do Asaas quando PIX é confirmado
  // ⚠️ IMPACTO: Aciona CotaService.confirmar() e NotificacaoService
  async processarWebhook(payload: AsaasWebhookPayload): Promise<void> {
    if (payload.event !== 'PAYMENT_RECEIVED') return

    const pagamento = await this.db.pagamento.findUnique({
      where: { provedorId: payload.payment.id },
    })

    if (!pagamento) {
      console.error('Pagamento não encontrado para webhook:', payload.payment.id)
      return
    }

    if (pagamento.status === "PAGO" as any) return // idempotência

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

    // Expirar automaticamente se vencido
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

  // ─── Métodos privados de integração Asaas ──────────────

  private async obterClienteAsaas(dto: CriarPagamentoDTO): Promise<string> {
    const res = await fetch(`${ASAAS_BASE_URL}/customers?cpfCnpj=${dto.cpf}`, {
      headers: this.headers(),
    })
    const data = await res.json()

    if (data.data?.length > 0) return data.data[0].id

    // Criar novo cliente
    const criar = await fetch(`${ASAAS_BASE_URL}/customers`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        name:    dto.nome,
        cpfCnpj: dto.cpf,
        email:   dto.email,
      }),
    })
    const cliente = await criar.json()
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

  private async buscarQrCode(cobrancaId: string) {
    const res = await fetch(
      `${ASAAS_BASE_URL}/payments/${cobrancaId}/pixQrCode`,
      { headers: this.headers() }
    )
    const data = await res.json()
    return { payload: data.payload, imageUrl: data.encodedImage }
  }

  private async verificarLimiteTentativas(cpf: string): Promise<void> {
    const umaHoraAtras = new Date(Date.now() - 60 * 60 * 1000)
    // Em produção: buscar por CPF criptografado
    const count = await this.db.pagamento.count({
      where: {
        criadoEm: { gte: umaHoraAtras },
        usuario: { cpf },
      },
    })

    if (count >= MAX_TENTATIVAS_CPF) {
      throw new Error(
        'Limite de tentativas de pagamento atingido. Aguarde 1 hora.'
      )
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

