// app/api/sorteios/route.ts
// SorteioMax — Lista sorteios ativos (GET público) e cria sorteio (POST admin legado)

import { NextRequest, NextResponse } from 'next/server'
import { criarContainer } from '@/lib/container'
import { z } from 'zod'

const CriarSorteioSchema = z.object({
  titulo:           z.string().min(5).max(120),
  descricao:        z.string().optional(),
  valorCota:        z.number().positive(),
  totalCotas:       z.number().int().min(10).max(100_000),
  dataApuracao:     z.string(),
  dataLoteria:      z.string(),
  premioDescricao:  z.string().min(5),
  premioValor:      z.number().positive(),
  certificadoSpaMf: z.string().min(5),
  cnpjPromotora:    z.string(),
  regulamentoUrl:   z.string().url().optional(),
  dataAutorizacao:  z.string().optional(),
  loteriaSerie:     z.enum(['1', '2', '3', '4', '5']).optional(),
})

export async function GET() {
  try {
    const { sorteio } = criarContainer()
    const sorteios = await sorteio.buscarAtivos()
    return NextResponse.json({ sorteios })
  } catch (err: any) {
    console.error('[GET /api/sorteios]', err)
    return NextResponse.json({ error: 'Erro ao buscar sorteios.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = CriarSorteioSchema.parse(body)
    const adminId = req.headers.get('x-user-id') ?? 'system'
    const { sorteio, cota } = criarContainer()

    const novoSorteio = await sorteio.criar(
      {
        ...data,
        dataApuracao:    new Date(data.dataApuracao),
        dataLoteria:     new Date(data.dataLoteria),
        dataAutorizacao: data.dataAutorizacao ? new Date(data.dataAutorizacao) : undefined,
      },
      adminId
    )

    await cota.gerarCotas(novoSorteio.id, novoSorteio.totalCotas)
    return NextResponse.json({ sorteio: novoSorteio }, { status: 201 })
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      return NextResponse.json({ error: 'Dados inválidos.', details: err.errors }, { status: 400 })
    }
    console.error('[POST /api/sorteios]', err)
    return NextResponse.json({ error: err.message ?? 'Erro interno.' }, { status: 500 })
  }
}
