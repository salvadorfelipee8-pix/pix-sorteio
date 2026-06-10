// app/api/sorteios/[slug]/verificar/route.ts
// SorteioMax — Verificação pública de auditoria do sorteio (hash SHA-256)

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { LotteryService } from '@/lib/classes/lottery-service'

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const sorteio = await prisma.sorteio.findUnique({
      where: { slug: params.slug },
      select: {
        id: true,
        titulo: true,
        status: true,
        totalCotas: true,
        cotaVencedora: true,
        loteriaResultado: true,
        loteriaSerie: true,
        baseCongelada: true,
        baseCongeladaEm: true,
        baseHashSha256: true
      }
    })

    if (!sorteio) {
      return NextResponse.json({ error: 'Sorteio não encontrado' }, { status: 404 })
    }

    if (!sorteio.baseCongelada || !sorteio.baseHashSha256) {
      return NextResponse.json({
        verificavel: false,
        motivo: 'Base ainda não foi congelada'
      })
    }

    if (sorteio.status !== 'FINALIZADO' || !sorteio.cotaVencedora || !sorteio.loteriaResultado) {
      return NextResponse.json({
        verificavel: true,
        finalizado: false,
        hashBase: sorteio.baseHashSha256,
        congeladoEm: sorteio.baseCongeladaEm
      })
    }

    const lottery = new LotteryService()
    const valido = lottery.verificarHash(
      sorteio.cotaVencedora,
      sorteio.loteriaResultado,
      sorteio.loteriaSerie ?? '1',
      sorteio.totalCotas,
      sorteio.baseHashSha256
    )

    return NextResponse.json({
      verificavel: true,
      finalizado: true,
      valido,
      cotaVencedora: sorteio.cotaVencedora,
      numeroLoteria: sorteio.loteriaResultado,
      serie: sorteio.loteriaSerie,
      totalCotas: sorteio.totalCotas,
      hashBase: sorteio.baseHashSha256,
      algoritmo: `SHA256(${sorteio.loteriaResultado}-${sorteio.loteriaSerie}-BASE_HASH) MOD ${sorteio.totalCotas} + 1`,
      congeladoEm: sorteio.baseCongeladaEm
    })
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
