// lib/classes/admin-service.ts
// SorteioMax — Serviço central do painel admin
// IMPACTO: Chama AuditoriaService, SorteioService, CongelamentoService

import { prisma } from '@/lib/prisma'

export interface MetricasDashboard {
  totalArrecadado: number
  cotasVendidas: number
  sorteiosAtivos: number
  sorteiosTotal: number
  ticketMedio: number
  ultimosSorteios: Array<{
    id: string
    titulo: string
    status: string
    cotasVendidas: number
    totalCotas: number
    valorCota: number
    dataApuracao: string
  }>
}

export interface CriarSorteioInput {
  slug: string
  titulo: string
  descricao?: string
  imagemUrl?: string
  valorCota: number
  totalCotas: number
  dataApuracao: string
  dataLoteria: string
  premioDescricao: string
  premioValor: number
  certificadoSpaMf: string
  cnpjPromotora: string
  regulamentoUrl?: string
  dataAutorizacao?: string
  loteriaSerie?: string
}

export interface EditarSorteioInput extends Partial<CriarSorteioInput> {
  status?: string
}

export class AdminService {
  async getMetricas(): Promise<MetricasDashboard> {
    const [pagamentosAggregate, cotasAggregate, sorteiosAtivos, sorteiosTotal, ultimosSorteios] =
      await Promise.all([
        prisma.pagamento.aggregate({
          _sum: { valor: true },
          where: { status: 'PAGO' }
        }),
        prisma.cota.count({ where: { status: 'PAGA' } }),
        prisma.sorteio.count({ where: { status: 'ATIVO' } }),
        prisma.sorteio.count(),
        prisma.sorteio.findMany({
          take: 5,
          orderBy: { criadoEm: 'desc' },
          select: {
            id: true,
            titulo: true,
            status: true,
            cotasVendidas: true,
            totalCotas: true,
            valorCota: true,
            dataApuracao: true
          }
        })
      ])

    const totalArrecadado = Number(pagamentosAggregate._sum.valor ?? 0)
    const ticketMedio = cotasAggregate > 0 ? totalArrecadado / cotasAggregate : 0

    return {
      totalArrecadado,
      cotasVendidas: cotasAggregate,
      sorteiosAtivos,
      sorteiosTotal,
      ticketMedio,
      ultimosSorteios: ultimosSorteios.map((s: any) => ({
        id: s.id,
        titulo: s.titulo,
        status: s.status,
        cotasVendidas: s.cotasVendidas,
        totalCotas: s.totalCotas,
        valorCota: Number(s.valorCota),
        dataApuracao: s.dataApuracao.toISOString()
      }))
    }
  }

  async listarSorteios() {
    const sorteios = await prisma.sorteio.findMany({
      orderBy: { criadoEm: 'desc' },
      select: {
        id: true,
        slug: true,
        titulo: true,
        status: true,
        valorCota: true,
        totalCotas: true,
        cotasVendidas: true,
        dataApuracao: true,
        baseCongelada: true,
        baseCongeladaEm: true,
        baseHashSha256: true,
        criadoEm: true
      }
    })
    return sorteios.map((s: any) => ({
      ...s,
      valorCota: Number(s.valorCota)
    }))
  }

  async getSorteio(id: string) {
    const sorteio = await prisma.sorteio.findUnique({
      where: { id },
      include: {
        _count: { select: { cotas: true } }
      }
    })
    if (!sorteio) return null
    return { ...sorteio, valorCota: Number(sorteio.valorCota), premioValor: Number(sorteio.premioValor) }
  }

  async criarSorteio(data: CriarSorteioInput, adminEmail: string) {
    const sorteio = await prisma.sorteio.create({
      data: {
        slug: data.slug,
        titulo: data.titulo,
        descricao: data.descricao,
        imagemUrl: data.imagemUrl,
        valorCota: data.valorCota,
        totalCotas: data.totalCotas,
        dataApuracao: new Date(data.dataApuracao),
        dataLoteria: new Date(data.dataLoteria),
        premioDescricao: data.premioDescricao,
        premioValor: data.premioValor,
        certificadoSpaMf: data.certificadoSpaMf,
        cnpjPromotora: data.cnpjPromotora,
        regulamentoUrl: data.regulamentoUrl,
        dataAutorizacao: data.dataAutorizacao ? new Date(data.dataAutorizacao) : undefined,
        loteriaSerie: data.loteriaSerie,
        status: 'RASCUNHO'
      }
    })

    await prisma.logAuditoria.create({
      data: {
        acao: 'SORTEIO_CRIADO',
        entidade: 'Sorteio',
        entidadeId: sorteio.id,
        payload: { adminEmail, slug: sorteio.slug } as any
      }
    })

    return sorteio
  }

  async editarSorteio(id: string, data: EditarSorteioInput, adminEmail: string) {
    const sorteio = await prisma.sorteio.findUnique({ where: { id } })
    if (!sorteio) throw new Error('Sorteio não encontrado')

    const updated = await prisma.sorteio.update({
      where: { id },
      data: {
        ...(data.titulo && { titulo: data.titulo }),
        ...(data.descricao !== undefined && { descricao: data.descricao }),
        ...(data.imagemUrl !== undefined && { imagemUrl: data.imagemUrl }),
        ...(data.valorCota && { valorCota: data.valorCota }),
        ...(data.totalCotas && { totalCotas: data.totalCotas }),
        ...(data.dataApuracao && { dataApuracao: new Date(data.dataApuracao) }),
        ...(data.dataLoteria && { dataLoteria: new Date(data.dataLoteria) }),
        ...(data.premioDescricao && { premioDescricao: data.premioDescricao }),
        ...(data.premioValor && { premioValor: data.premioValor }),
        ...(data.certificadoSpaMf && { certificadoSpaMf: data.certificadoSpaMf }),
        ...(data.cnpjPromotora && { cnpjPromotora: data.cnpjPromotora }),
        ...(data.regulamentoUrl !== undefined && { regulamentoUrl: data.regulamentoUrl }),
        ...(data.status && { status: data.status as any }),
        ...(data.loteriaSerie !== undefined && { loteriaSerie: data.loteriaSerie })
      }
    })

    await prisma.logAuditoria.create({
      data: {
        acao: 'SORTEIO_EDITADO',
        entidade: 'Sorteio',
        entidadeId: id,
        payload: { adminEmail, campos: Object.keys(data) } as any
      }
    })

    return updated
  }

  async listarParticipantes(sorteioId: string) {
    const cotas = await prisma.cota.findMany({
      where: { sorteioId, status: { in: ['PAGA', 'RESERVADA'] } },
      include: {
        usuario: {
          select: { id: true, nome: true, email: true, telefone: true }
        },
        pagamento: {
          select: { id: true, valor: true, status: true, paidAt: true }
        }
      },
      orderBy: { numero: 'asc' }
    })

    return cotas.map((c: any) => ({
      numero: c.numero,
      status: c.status,
      usuario: c.usuario,
      pagamento: c.pagamento
        ? { ...c.pagamento, valor: Number(c.pagamento.valor) }
        : null
    }))
  }

  async exportarLogsCSV(sorteioId?: string): Promise<string> {
    const where = sorteioId ? { sorteioId } : {}

    const logs = await prisma.logAuditoria.findMany({
      where,
      include: {
        usuario: { select: { email: true } },
        sorteio: { select: { titulo: true } }
      },
      orderBy: { criadoEm: 'desc' },
      take: 10000
    })

    const header = 'id,acao,entidade,entidadeId,usuarioEmail,sorteio,ipAddress,hashEstado,criadoEm\n'
    const rows = logs
      .map((l: any) =>
        [
          l.id,
          l.acao,
          l.entidade,
          l.entidadeId ?? '',
          l.usuario?.email ?? '',
          l.sorteio?.titulo ?? '',
          l.ipAddress ?? '',
          l.hashEstado ?? '',
          l.criadoEm.toISOString()
        ]
          .map((v: any) => `"${String(v).replace(/"/g, '""')}"`)
          .join(',')
      )
      .join('\n')

    return header + rows
  }
}
