// app/api/auth/cadastro/route.ts
// SorteioMax — API de cadastro de participante

import { NextRequest, NextResponse } from 'next/server'
import { criarContainer } from '@/lib/container'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { nome, email, cpf, telefone, dataNascimento, senha, lgpdAceito } = body

    if (!nome || !email || !cpf || !dataNascimento || !senha) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })
    }

    if (!lgpdAceito) {
      return NextResponse.json({ error: 'Aceite dos termos LGPD é obrigatório' }, { status: 400 })
    }

    const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? undefined
    const { auth } = criarContainer()

    const usuario = await auth.cadastrar({
      nome,
      email,
      cpf,
      telefone,
      dataNascimento: new Date(dataNascimento),
      senha,
      lgpdAceito,
      ipAddress: ip
    })

    return NextResponse.json(usuario, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Erro interno' }, { status: 400 })
  }
}
