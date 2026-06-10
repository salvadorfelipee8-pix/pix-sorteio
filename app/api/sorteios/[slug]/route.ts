// app/api/sorteios/[slug]/route.ts
// SorteioMax — Busca sorteio público por slug

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const sorteio = await prisma.sorteio.findUnique({
      where: { slug: params.slug },
      select: {
        id: true,
        slug: true,
        titulo: true,
        descricao: true,
        imagemUrl: true,
        valorCota: true,
        totalCotas: true,
        cotasVendidas: true,
        status: true,
        dataApuracao: true,
        dataLoteria: true,
        premioDescricao: true,
        premioValor: true,
        certificadoSpaMf: true,
        cnpjPromotora: true,
        regulamentoUrl: true,
        baseCongelada: true,
        cotaVencedora: true,
        loteriaResultado: true
      }
    })

    if (!sorteio) {
      return NextResponse.json({ error: 'Sorteio não encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      sorteio: {
        ...sorteio,
        valorCota: Number(sorteio.valorCota),
        premioValor: Number(sorteio.premioValor)
      }
    })
  } catch (err: any) {
    console.error('[GET /api/sorteios/[slug]]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
