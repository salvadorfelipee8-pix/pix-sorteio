// app/api/sorteios/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { criarContainer } from '@/lib/container'

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { sorteio } = criarContainer()
    const s = await sorteio.buscarPorSlug(params.slug)
    if (!s) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
    return NextResponse.json({ sorteio: s })
  } catch (err) {
    console.error('[GET /api/sorteios/slug]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
