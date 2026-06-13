// app/api/pagamentos/criar/route.ts
// SorteioMax — Cria cobrança PIX com guest checkout
// IMPACTO: CotaService.reservar() → PagamentoService.criarCobrancaPix() → AuditoriaService

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

    const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? undefined
    const { cota, pagamento, prisma, auditoria, auth } = criarContainer()

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

    const session = await getServerSession(authOptions)

    type UsuarioBasico = { id: string; nome: string; email: string; cpf: string }
    let usuario: UsuarioBasico | null = null
    let cpfRaw: string = cpf ? cpf.replace(/\D/g, '') : ''

    // ── Usuário logado ──────────────────────────────────────────
    if (session?.user?.email) {
      const dbUser = await prisma.usuario.findUnique({
        where: { email: session.user.email },
        select: { id: true, nome: true, email: true, cpf: true }
      })
      if (dbUser) {
        usuario = dbUser
        // Detecta formato: criptografado (iv:encrypted) ou puro (usuário guest antigo)
        cpfRaw = dbUser.cpf.includes(':') ? auth.descriptografar(dbUser.cpf) : dbUser.cpf
      }
    }

    // ── Guest checkout ──────────────────────────────────────────
    if (!usuario) {
      if (!nome || !email || !cpf) {
        return NextResponse.json({ error: 'Nome, email e CPF são obrigatórios' }, { status: 400 })
      }

      const emailNormalizado = email.toLowerCase().trim()
      cpfRaw = cpf.replace(/\D/g, '')

      const existente = await prisma.usuario.findUnique({
        where: { email: emailNormalizado },
        select: { id: true, nome: true, email: true, cpf: true }
      })

      if (existente) {
        usuario = existente
        // Detecta se CPF no banco está criptografado (formato iv:encrypted) ou em texto puro (guest antigo)
        cpfRaw = existente.cpf.includes(':') ? auth.descriptografar(existente.cpf) : existente.cpf
      } else {
        // Cria conta automaticamente — CPF criptografado para conformidade LGPD
        const senhaTemporaria = randomBytes(16).toString('hex')
        const senhaHash = await bcrypt.hash(senhaTemporaria, 12)
        const cpfCriptografado = auth.criptografarCpf(cpfRaw)

        const novoUsuario = await prisma.usuario.create({
          data: {
            nome: nome.trim(),
            email: emailNormalizado,
            cpf: cpfCriptografado,
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
          usuarioId: novoUsuario.id,
          acao: 'USUARIO_CRIADO_GUEST_CHECKOUT',
          entidade: 'Usuario',
          entidadeId: novoUsuario.id,
          payload: { email: novoUsuario.email, origem: 'checkout_pix' },
          ipAddress: ip
        })
      }
    }

    if (!usuario) {
      return NextResponse.json({ error: 'Erro ao processar usuário' }, { status: 500 })
    }

    const usuarioFinal: UsuarioBasico = usuario
    const valor = Number(sorteio.valorCota) * quantidade

    const cotasReservadas = await cota.reservar({
      sorteioId,
      usuarioId: usuarioFinal.id,
      quantidade,
      ipAddress: ip
    })

    let resultado
    try {
      resultado = await pagamento.criarCobrancaPix({
        usuarioId: usuarioFinal.id,
        cpf: usuarioFinal.cpf,
        cpfRaw,
        email: usuarioFinal.email,
        nome: usuarioFinal.nome,
        valor,
        cotaIds: cotasReservadas.map((c: any) => c.id),
        sorteioId,
        ipAddress: ip
      })
    } catch (pagErr: any) {
      // Libera as cotas reservadas se a criação do pagamento falhar
      await cota.liberarReserva(cotasReservadas.map((c: any) => c.id)).catch(() => {})
      throw pagErr
    }

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
