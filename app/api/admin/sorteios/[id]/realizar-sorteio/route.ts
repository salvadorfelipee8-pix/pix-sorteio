// app/api/admin/sorteios/[id]/realizar-sorteio/route.ts
// SorteioMax — Realiza o sorteio: busca resultado Loteria Federal + determina vencedor + notifica
// IMPACTO: LotteryService → SorteioService → NotificacaoService → AuditoriaService

import { NextRequest, NextResponse } from 'next/server'
import { criarContainer } from '@/lib/container'
import { AdminAuthService } from '@/lib/classes/admin-auth-service'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await AdminAuthService.getSessionFromCookies()
    const adminEmail = session?.email ?? 'admin'

    const body = await req.json()
    // numeroLoteria pode ser informado manualmente ou buscado automaticamente
    const { numeroLoteria, serie, buscarAutomatico, dataLoteria } = body

    const { lottery, prisma, notificacao, auditoria } = criarContainer()

    // Busca o sorteio
    const sorteio = await prisma.sorteio.findUnique({
      where: { id: params.id }
    })

    if (!sorteio) {
      return NextResponse.json({ error: 'Sorteio não encontrado' }, { status: 404 })
    }

    if (!sorteio.baseCongelada || !sorteio.baseHashSha256) {
      return NextResponse.json({ error: 'Base deve ser congelada antes de realizar o sorteio' }, { status: 400 })
    }

    if (sorteio.status === 'FINALIZADO') {
      return NextResponse.json({ error: 'Sorteio já foi realizado' }, { status: 400 })
    }

    let numLoteria = numeroLoteria

    // Busca automática da API da Caixa se solicitado
    if (buscarAutomatico && dataLoteria) {
      const resultado = await lottery.buscarResultado(dataLoteria)
      if (!resultado || !resultado.premios.length) {
        return NextResponse.json({
          error: 'Resultado da Loteria Federal não disponível ainda para esta data. Informe manualmente.'
        }, { status: 400 })
      }
      // Usa o prêmio correspondente à série configurada
      const ordemSerie = parseInt(serie ?? '1') || 1
      const premio = resultado.premios.find((p: any) => p.ordem === ordemSerie)
      numLoteria = premio?.numero ?? resultado.premios[0].numero
    }

    if (!numLoteria) {
      return NextResponse.json({ error: 'Número da loteria é obrigatório' }, { status: 400 })
    }

    const serieUsada = serie ?? sorteio.loteriaSerie ?? '1'

    // Calcula cota vencedora
    const calculo = lottery.calcularVencedor(
      numLoteria,
      serieUsada,
      sorteio.totalCotas,
      sorteio.baseHashSha256
    )

    // Busca a cota vencedora e seu dono
    const cotaVencedora = await prisma.cota.findFirst({
      where: { sorteioId: params.id, numero: calculo.cotaVencedora },
      include: {
        usuario: { select: { id: true, nome: true, email: true } }
      }
    })

    // Atualiza sorteio com resultado
    await prisma.sorteio.update({
      where: { id: params.id },
      data: {
        status: 'FINALIZADO' as any,
        loteriaResultado: numLoteria,
        loteriaSerie: serieUsada,
        cotaVencedora: calculo.cotaVencedora,
        usuarioVencedor: cotaVencedora?.usuarioId ?? null
      }
    })

    // Registra auditoria
    await auditoria.registrar({
      sorteioId: params.id,
      acao: 'SORTEIO_REALIZADO',
      entidade: 'Sorteio',
      entidadeId: params.id,
      payload: {
        adminEmail,
        numeroLoteria: numLoteria,
        serie: serieUsada,
        cotaVencedora: calculo.cotaVencedora,
        hashVerificacao: calculo.hashVerificacao,
        algoritmo: calculo.algoritmo,
        vencedor: cotaVencedora?.usuario?.email ?? 'cota sem dono'
      }
    })

    // Notifica todos os participantes
    const cotasParticipantes = await prisma.cota.findMany({
      where: { sorteioId: params.id, status: 'PAGA' as any },
      include: {
        usuario: { select: { nome: true, email: true } }
      },
      orderBy: { numero: 'asc' }
    })

    // Agrupa cotas por usuário
    const porUsuario = new Map<string, { nome: string; email: string; numeros: number[] }>()
    for (const c of cotasParticipantes) {
      if (!c.usuario?.email) continue
      const key = c.usuario.email
      if (!porUsuario.has(key)) {
        porUsuario.set(key, { nome: c.usuario.nome, email: c.usuario.email, numeros: [] })
      }
      porUsuario.get(key)!.numeros.push(c.numero)
    }

    // Envia emails em paralelo (sem aguardar para não travar a resposta)
    const emailPromises = Array.from(porUsuario.values()).map(u =>
      notificacao.enviarResultado({
        email: u.email,
        nome: u.nome,
        tituloSorteio: sorteio.titulo,
        cotaVencedora: calculo.cotaVencedora,
        numerosCotas: u.numeros,
        ganhou: u.numeros.includes(calculo.cotaVencedora),
        premioDescricao: sorteio.premioDescricao
      })
    )

    // Fire and forget — não bloqueia a resposta
    Promise.allSettled(emailPromises).catch(console.error)

    return NextResponse.json({
      success: true,
      cotaVencedora: calculo.cotaVencedora,
      numeroLoteria: numLoteria,
      serie: serieUsada,
      hashVerificacao: calculo.hashVerificacao,
      algoritmo: calculo.algoritmo,
      vencedor: cotaVencedora?.usuario ?? null,
      totalNotificados: porUsuario.size
    })
  } catch (err: any) {
    console.error('[realizar-sorteio]', err)
    return NextResponse.json({ error: err.message ?? 'Erro interno' }, { status: 500 })
  }
}
