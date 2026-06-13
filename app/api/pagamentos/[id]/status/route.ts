// app/api/pagamentos/[id]/status/route.ts
// SorteioMax — Polling de status do pagamento + retorna números das cotas confirmadas

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
          pagamentoId: params.id,
          status: 'PAGA' as any
        },
        select: { numero: true },
        orderBy: { numero: 'asc' }
      })

      if (cotasPagas.length > 0) {
        return NextResponse.json({
          status,
          numerosCotas: cotasPagas.map((c: any) => c.numero)
        })
      }

      // Fallback: busca pelo usuário + sorteio via cotas ligadas ao pagamento (qualquer status)
      const pg = await prisma.pagamento.findUnique({
        where: { id: params.id },
        include: {
          cotas: { select: { numero: true, sorteioId: true, usuarioId: true } }
        }
      })

      if (pg && pg.cotas.length > 0) {
        const primeira = pg.cotas[0]
        const todasCotas = await prisma.cota.findMany({
          where: {
            usuarioId: primeira.usuarioId ?? undefined,
            sorteioId: primeira.sorteioId,
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

    return NextResponse.json({ status, numerosCotas: [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 404 })
  }
}
