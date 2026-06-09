// app/api/minha-conta/cotas/route.ts
// SorteioMax — Cotas compradas pelo usuário logado

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { criarContainer } from '@/lib/container'

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { prisma } = criarContainer()

    const usuario = await prisma.usuario.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!usuario) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    const cotas = await prisma.cota.findMany({
      where: {
        usuarioId: usuario.id,
        status: { in: ['PAGA', 'RESERVADA'] as any[] }
      },
      include: {
        sorteio: {
          select: {
            id: true,
            slug: true,
            titulo: true,
            status: true,
            dataApuracao: true,
            premioDescricao: true,
            premioValor: true,
            imagemUrl: true,
            cotaVencedora: true,
            loteriaResultado: true,
            baseHashSha256: true
          }
        },
        pagamento: {
          select: { valor: true, status: true, paidAt: true }
        }
      },
      orderBy: { criadoEm: 'desc' }
    })

    // Agrupa por sorteio
    const porSorteio = new Map<string, any>()
    for (const c of cotas) {
      const sid = c.sorteioId
      if (!porSorteio.has(sid)) {
        porSorteio.set(sid, {
          sorteio: {
            ...c.sorteio,
            premioValor: Number(c.sorteio?.premioValor ?? 0)
          },
          cotas: []
        })
      }
      porSorteio.get(sid).cotas.push({
        id: c.id,
        numero: c.numero,
        status: c.status,
        pagamento: c.pagamento
          ? { ...c.pagamento, valor: Number(c.pagamento.valor) }
          : null
      })
    }

    return NextResponse.json(Array.from(porSorteio.values()))
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
