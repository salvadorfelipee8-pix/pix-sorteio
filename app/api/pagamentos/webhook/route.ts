// app/api/pagamentos/webhook/route.ts
// SorteioMax — Webhook Asaas: confirma pagamento + cotas + envia email
// IMPACTO: PagamentoService → CotaService → NotificacaoService → AuditoriaService

import { NextRequest, NextResponse } from 'next/server'
import { criarContainer } from '@/lib/container'

export async function POST(req: NextRequest) {
  try {
    const body      = await req.text()
    const signature = req.headers.get('asaas-access-token') ?? ''

    if (!verificarAssinatura(signature)) {
      console.warn('[Webhook] Assinatura inválida')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = JSON.parse(body)

    if (payload.event !== 'PAYMENT_RECEIVED') {
      return NextResponse.json({ received: true })
    }

    // Uma única instância do container por request — sem duplicação
    const { pagamento, cota, notificacao, prisma } = criarContainer()

    // 1. Atualizar status do pagamento
    await pagamento.processarWebhook(payload)

    // 2. Buscar pagamento com cotas e dados do usuário
    const pgRecord = await prisma.pagamento.findUnique({
      where: { provedorId: payload.payment.id },
      include: {
        cotas: {
          include: {
            sorteio: { select: { id: true, titulo: true, slug: true, dataApuracao: true } }
          }
        },
        usuario: { select: { id: true, nome: true, email: true } }
      }
    })

    if (!pgRecord) {
      console.error('[Webhook] Pagamento não encontrado:', payload.payment.id)
      return NextResponse.json({ received: true })
    }

    // 3. Confirmar cotas (idempotente)
    if (pgRecord.cotas.length > 0 && pgRecord.status === 'PAGO' as any) {
      const cotaIds = pgRecord.cotas.map((c: any) => c.id)
      await cota.confirmar(cotaIds, pgRecord.id)

      // 4. Buscar todos os números de cotas do usuário neste sorteio após confirmação
      const sorteioId = pgRecord.cotas[0].sorteioId
      const cotasUsuario = await prisma.cota.findMany({
        where: {
          usuarioId: pgRecord.usuarioId,
          sorteioId,
          status: 'PAGA' as any
        },
        select: { numero: true },
        orderBy: { numero: 'asc' }
      })

      const sorteio = pgRecord.cotas[0].sorteio

      // 5. Enviar email de confirmação
      if (pgRecord.usuario?.email && sorteio) {
        await notificacao.enviarConfirmacaoCompra({
          email: pgRecord.usuario.email,
          nome: pgRecord.usuario.nome,
          tituloSorteio: sorteio.titulo,
          numerosCotas: cotasUsuario.map((c: any) => c.numero),
          valorTotal: Number(pgRecord.valor),
          dataApuracao: sorteio.dataApuracao,
          slugSorteio: sorteio.slug
        })
      }
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('[Webhook PIX]', err)
    // Sempre 200 para evitar reenvios do Asaas
    return NextResponse.json({ received: true })
  }
}

function verificarAssinatura(token: string): boolean {
  const esperado = process.env.ASAAS_WEBHOOK_SECRET ?? ''
  return token === esperado || process.env.ASAAS_ENV === 'sandbox'
}
