// app/api/sorteios/[slug]/verificar/route.ts
// SorteioMax — API pública: verificar cota de participante por email ou número

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.trim()

    if (!q) return NextResponse.json({ found: false })

    const sorteio = await prisma.sorteio.findUnique({
      where: { slug: params.slug },
      select: { id: true, cotaVencedora: true, status: true }
    })

    if (!sorteio || sorteio.status !== 'FINALIZADO') {
      return NextResponse.json({ found: false, reason: 'Sorteio não finalizado' })
    }

    // Busca por email
    const isEmail = q.includes('@')

    if (isEmail) {
      const usuario = await prisma.usuario.findUnique({
        where: { email: q.toLowerCase() }
      })

      if (!usuario) return NextResponse.json({ found: false })

      const cotas = await prisma.cota.findMany({
        where: { sorteioId: sorteio.id, usuarioId: usuario.id, status: 'PAGA' },
        select: { numero: true }
      })

      if (cotas.length === 0) return NextResponse.json({ found: false })

      const numeros = cotas.map((c: any) => c.numero)
      const isVencedor = numeros.includes(sorteio.cotaVencedora)

      return NextResponse.json({ found: true, numeros, isVencedor })
    }

    // Busca por número de cota
    const numero = parseInt(q.replace(/\D/g, ''), 10)
    if (isNaN(numero)) return NextResponse.json({ found: false })

    const cota = await prisma.cota.findFirst({
      where: { sorteioId: sorteio.id, numero },
      select: { numero: true, status: true }
    })

    if (!cota) return NextResponse.json({ found: false })

    return NextResponse.json({
      found: true,
      numero: cota.numero,
      numeros: [cota.numero],
      isVencedor: cota.numero === sorteio.cotaVencedora
    })
  } catch (error: any) {
    return NextResponse.json({ found: false }, { status: 500 })
  }
}
