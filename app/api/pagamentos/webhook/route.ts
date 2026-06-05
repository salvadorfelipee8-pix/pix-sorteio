// app/api/pagamentos/webhook/route.ts
// ⚠️ IMPACTO: Este endpoint aciona CotaService e NotificacaoService

import { NextRequest, NextResponse } from 'next/server'
import { criarContainer } from '@/lib/container'
import { createHmac }     from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const body      = await req.text()
    const signature = req.headers.get('asaas-access-token') ?? ''

    // Verificar autenticidade do webhook
    if (!verificarAssinatura(body, signature)) {
      console.warn('[Webhook] Assinatura inválida')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = JSON.parse(body)

    const { pagamento, cota } = criarContainer()

    // Processar confirmação de pagamento
    await pagamento.processarWebhook(payload)

    // Se pagamento confirmado → confirmar cotas
    if (payload.event === 'PAYMENT_RECEIVED') {
      const pg = await pagamento.verificarStatus(payload.payment.id)

      if (pg === 'PAGO') {
        // Buscar cotas reservadas para este pagamento
        const { prisma } = criarContainer()
        const pgRecord = await prisma.pagamento.findUnique({
          where: { provedorId: payload.payment.id },
          include: { cota: true },
        })

        if (pgRecord?.cota) {
          await cota.confirmar([pgRecord.cota.id], pgRecord.id)
        }

        // TODO: disparar NotificacaoService (Fase 3)
      }
    }

    return NextResponse.json({ received: true })

  } catch (err) {
    console.error('[Webhook PIX]', err)
    // Retornar 200 para evitar reenvios do Asaas
    return NextResponse.json({ received: true })
  }
}

function verificarAssinatura(body: string, token: string): boolean {
  // Asaas usa token estático — em produção verificar HMAC
  const esperado = process.env.ASAAS_WEBHOOK_SECRET ?? ''
  return token === esperado || process.env.ASAAS_ENV === 'sandbox'
}
