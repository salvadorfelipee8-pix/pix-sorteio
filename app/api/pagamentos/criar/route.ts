// app/api/pagamentos/criar/route.ts
// SorteioMax — Cria cobrança PIX e reserva cotas
// IMPACTO: CotaService.reservar() → PagamentoService.criarCobrancaPix() → AuditoriaService

import { NextRequest, NextResponse } from 'next/server'
import { criarContainer } from '@/lib/container'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const body = await req.json()
    const { sorteioId, quantidade, cpf } = body

    if (!sorteioId || !quantidade || quantidade < 1) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? undefined
    const { cota, pagamento, prisma } = criarContainer()

    // Verifica se sorteio está ativo e base não congelada
    const sorteio = await prisma.sorteio.findUnique({
      where: { id: sorteioId },
      select: { id: true, status: true, baseCongelada: true, valorCota: true, titulo: true }
    })

    if (!sorteio) {
      return NextResponse.json({ error: 'Sorteio não encontrado' }, { status: 404 })
    }

    if (sorteio.status !== 'ATIVO') {
      return NextResponse.json({ error: 'Sorteio não está ativo' }, { status: 400 })
    }

    if (sorteio.baseCongelada) {
      return NextResponse.json({ error: 'Base do sorteio já foi congelada. Compras encerradas.' }, { status: 400 })
    }

    // Busca dados do usuário
    const usuario = await prisma.usuario.findUnique({
      where: { email: session.user.email! },
      select: { id: true, nome: true, email: true, cpf: true }
    })

    if (!usuario) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    const valor = Number(sorteio.valorCota) * quantidade

    // Reserva as cotas
    const cotasReservadas = await cota.reservar({
      sorteioId,
      usuarioId: usuario.id,
      quantidade,
      ipAddress: ip
    })

    // Cria cobrança PIX
    const resultado = await pagamento.criarCobrancaPix({
      usuarioId: usuario.id,
      cpf: cpf ?? usuario.cpf,
      email: usuario.email,
      nome: usuario.nome,
      valor,
      cotaIds: cotasReservadas.map((c: any) => c.id),
      sorteioId,
      ipAddress: ip
    })

    return NextResponse.json({
      pagamentoId: resultado.pagamentoId,
      qrCodePayload: resultado.qrCodePayload,
      qrCodeImageUrl: resultado.qrCodeImageUrl,
      valor: resultado.valor,
      expiresAt: resultado.expiresAt,
      cotas: cotasReservadas.map((c: any) => ({ id: c.id, numero: c.numero }))
    })
  } catch (err: any) {
    console.error('[/api/pagamentos/criar]', err)
    return NextResponse.json({ error: err.message ?? 'Erro interno' }, { status: 500 })
  }
}
