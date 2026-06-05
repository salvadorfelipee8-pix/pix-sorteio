// app/api/pagamentos/criar/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { criarContainer } from '@/lib/container'
import { z } from 'zod'

const Schema = z.object({
  sorteioId:  z.string(),
  quantidade: z.number().int().min(1).max(100),
  nome:       z.string().min(3),
  email:      z.string().email(),
  cpf:        z.string().length(11),
  telefone:   z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = Schema.parse(await req.json())
    const ip   = req.headers.get('x-forwarded-for') ?? undefined

    const { auth, sorteio, cota, pagamento, prisma } = criarContainer()

    // Buscar ou criar usuário
    const sorteioData = await sorteio.buscarPorId(body.sorteioId)

    // Cadastrar usuário rápido (sem senha — fluxo guest)
    let usuario = await prisma.usuario.findFirst({
      where: { email: body.email.toLowerCase() },
    })

    if (!usuario) {
      usuario = await prisma.usuario.create({
        data: {
          nome:        body.nome,
          email:       body.email.toLowerCase(),
          cpf:         body.cpf, // Em produção: criptografar
          telefone:    body.telefone,
          lgpdAceito:  true,
          lgpdAceitoEm: new Date(),
        },
      })
    }

    // Reservar cotas
    const cotas = await cota.reservar({
      sorteioId: body.sorteioId,
      usuarioId: usuario.id,
      quantidade: body.quantidade,
      ipAddress: ip,
    })

    const valor = Number(sorteioData.valorCota) * body.quantidade

    // Criar cobrança PIX
    const qr = await pagamento.criarCobrancaPix({
      usuarioId:  usuario.id,
      cpf:        body.cpf,
      email:      body.email,
      nome:       body.nome,
      valor,
      cotaIds:    cotas.map(c => c.id),
      sorteioId:  body.sorteioId,
      ipAddress:  ip,
    })

    return NextResponse.json(qr, { status: 201 })

  } catch (err: any) {
    console.error('[POST /api/pagamentos/criar]', err)
    return NextResponse.json({ error: err.message ?? 'Erro ao criar pagamento.' }, { status: 400 })
  }
}
