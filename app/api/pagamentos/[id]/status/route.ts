// app/api/pagamentos/[id]/status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { criarContainer } from '@/lib/container'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { pagamento, prisma } = criarContainer()
    const status = await pagamento.verificarStatus(params.id)

    // Se pago, retorna os números das cotas
    let numerosCotas: number[] = []
    if (status === 'PAGO') {
      const pg = await prisma.pagamento.findUnique({
        where: { id: params.id },
        include: { cota: true },
      })
      if (pg?.cota) numerosCotas = [pg.cota.numero]
    }

    return NextResponse.json({ status, numerosCotas })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
