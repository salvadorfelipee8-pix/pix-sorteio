// app/api/pagamentos/criar/route.ts
// SorteioMax — Cria cobrança PIX com guest checkout
// IMPACTO: CotaService.reservar() → PagamentoService.criarCobrancaPix() → AuditoriaService
// Se usuário não está logado, cria conta automaticamente (sem senha) usando os dados do form

import { NextRequest, NextResponse } from 'next/server'
import { criarContainer } from '@/lib/container'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { sorteioId, quantidade, nome, email, cpf, telefone } = body

    if (!sorteioId || !quantidade || quantidade < 1) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    if (!nome || !email || !cpf) {
      return NextResponse.json({ error: 'Nome, email e CPF são obrigatórios' }, { status: 400 })
    }

    const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? undefined
    const { cota, pagamento, prisma, auditoria } = criarContainer()

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

    // Tenta sessão autenticada primeiro
    const session = await getServerSession(authOptions)

    let usuario: { id: string; nome: string; email: string; cpf: string } | null = null

    if (session?.user?.email) {
      usuario = await prisma.usuario.findUnique({
        where: { email: session.user.email },
        select: { id: true, nome: true, email: true, cpf: true }
      })
    }

    // GUEST CHECKOUT: sem sessão — busca por email ou cria conta automaticamente
    if (!usuario) {
      const emailNormalizado = email.toLowerCase().trim()
      const cpfLimpo = cpf.replace(/\D/g, '')

      const existente = await prisma.usuario.findUnique({
        where: { email: emailNormalizado },
        select: { id: true, nome: true, email: true, cpf: true }
      })

      if (existente) {
        usuario = existente
      } else {
        // Cria conta automaticamente com senha temporária aleatória (LGPD: aceite implícito na compra)
        const senhaTemporaria = randomBytes(16).toString('hex')
        const senhaHash = await bcrypt.hash(senhaTemporaria, 12)

        const novoUsuario = await prisma.usuario.create({
          data: {
            nome: nome.trim(),
            email: emailNormalizado,
            cpf: cpfLimpo,
            telefone: telefone ?? undefined,
            senhaHash,
            role: 'PARTICIPANTE' as any,
            lgpdAceito: true,
            lgpdAceitoEm: new Date()
          },
          select: { id: true, nome: true, email: true, cpf: true }
        })

        usuario = novoUsuario

        await auditoria.registrar({
          usuarioId: usuario.id,
          acao: 'USUARIO_CRIADO_GUEST_CHECKOUT',
          entidade: 'Usuario',
          entidadeId: usuario.id,
          payload: { email: usuario.email, origem: 'checkout_pix' },
          ipAddress: ip
        })
      }
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
      cpf: usuario.cpf,
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