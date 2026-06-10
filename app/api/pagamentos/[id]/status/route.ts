// app/api/pagamentos/[id]/status/route.ts
// SorteioMax — Polling de status do pagamento + retorna números das cotas confirmadas
// CORRIGIDO: agora inclui numerosCotas na resposta para o ModalCheckout

import { NextRequest, NextResponse } from 'next/server'
import { criarContainer } from '@/lib/container'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { pagamento } = criarContainer()
    const status = await pagamento.verificarStatus(params.id)

    // Se pago, retorna também os números das cotas confirmadas
    if (status === 'PAGO') {
      const cotasPagas = await prisma.cota.findMany({
        where: {
          pagamento: { id: params.id },
          status: 'PAGA' as any
        },
        select: { numero: true },
        orderBy: { numero: 'asc' }
      })

      // Fallback: busca pelo pagamentoId diretamente
      if (cotasPagas.length === 0) {
        const pg = await prisma.pagamento.findUnique({
          where: { id: params.id },
          include: {
            cota: { select: { numero: true, sorteioId: true, usuarioId: true } }
          }
        })

        if (pg?.cota) {
          // Busca todas as cotas pagas do usuário neste sorteio
          const todasCotas = await prisma.cota.findMany({
            where: {
              usuarioId: pg.cota.usuarioId ?? undefined,
              sorteioId: pg.cota.sorteioId,
              status: 'PAGA' as any
            },
            select: { numero: true },
            orderBy: { numero: 'asc' }
          })
          return NextResponse.json({
            status,
            numerosCotas: todasCotas.map((c: any) => c.numero)
          })
        }
      }

      return NextResponse.json({
        status,
        numerosCotas: cotasPagas.map((c: any) => c.numero)
      })
    }

    return NextResponse.json({ status, numerosCotas: [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 404 })
  }
}
