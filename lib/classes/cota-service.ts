import { prisma as _prismaType } from '@/lib/prisma'
type PrismaClient = typeof _prismaType
// lib/classes/cota-service.ts
// ⚠️ IMPACTO: Alterações aqui afetam PagamentoService, SorteioService e NotificacaoService


import { AuditoriaService } from './auditoria-service'

const RESERVA_MINUTOS = 15
const MAX_COTAS_POR_COMPRA = 100

export interface ReservarCotasDTO {
  sorteioId: string
  usuarioId: string
  quantidade: number
  ipAddress?: string
}

export class CotaService {
  private db: PrismaClient
  private auditoria: AuditoriaService

  constructor(db: PrismaClient, auditoria: AuditoriaService) {
    this.db = db
    this.auditoria = auditoria
  }

  // Gera todas as cotas de um sorteio (chamado pelo admin ao criar)
  async gerarCotas(sorteioId: string, total: number): Promise<void> {
    const lote = Array.from({ length: total }, (_, i) => ({
      sorteioId,
      numero: i + 1,
      status: "DISPONIVEL" as any,
    }))

    await this.db.cota.createMany({ data: lote })
  }

  // Reserva cotas aleatórias disponíveis para o usuário
  async reservar(dto: ReservarCotasDTO): Promise<any[]> {
    if (dto.quantidade > MAX_COTAS_POR_COMPRA) {
      throw new Error(`Máximo de ${MAX_COTAS_POR_COMPRA} cotas por compra.`)
    }

    // Limpar reservas expiradas antes de buscar
    await this.expirarReservas()

    const disponiveis = await this.db.cota.findMany({
      where: { sorteioId: dto.sorteioId, status: "DISPONIVEL" as any },
      take: dto.quantidade,
      orderBy: { numero: 'asc' },
    })

    if (disponiveis.length < dto.quantidade) {
      throw new Error(
        `Apenas ${disponiveis.length} cotas disponíveis. Tente uma quantidade menor.`
      )
    }

    const expiraEm = new Date(Date.now() + RESERVA_MINUTOS * 60 * 1000)
    const ids = disponiveis.map((c) => c.id)

    await this.db.cota.updateMany({
      where: { id: { in: ids } },
      data: {
        status: "RESERVADA" as any,
        usuarioId: dto.usuarioId,
        reservadaEm: new Date(),
        reservaExpiraEm: expiraEm,
      },
    })

    await this.auditoria.registrar({
      usuarioId: dto.usuarioId,
      sorteioId: dto.sorteioId,
      acao: 'COTAS_RESERVADAS',
      entidade: 'Cota',
      payload: {
        quantidade: dto.quantidade,
        numeros: disponiveis.map((c) => c.numero),
        expiraEm,
      },
      ipAddress: dto.ipAddress,
    })

    return disponiveis
  }

  // Confirma cotas após pagamento aprovado
  // ⚠️ IMPACTO: Chamado por PagamentoService após webhook PIX
  async confirmar(cotaIds: string[], pagamentoId: string): Promise<void> {
    await this.db.cota.updateMany({
      where: { id: { in: cotaIds } },
      data: {
        status: "PAGA" as any,
        pagamentoId,
        reservaExpiraEm: null,
      },
    })

    // Atualiza contador do sorteio
    const primeira = await this.db.cota.findFirst({
      where: { id: cotaIds[0] },
      select: { sorteioId: true },
    })

    if (primeira) {
      await this.db.sorteio.update({
        where: { id: primeira.sorteioId },
        data: { cotasVendidas: { increment: cotaIds.length } },
      })
    }
  }

  // Libera cotas reservadas não pagas
  async liberarReserva(cotaIds: string[]): Promise<void> {
    await this.db.cota.updateMany({
      where: { id: { in: cotaIds } },
      data: {
        status: "DISPONIVEL" as any,
        usuarioId: null,
        reservadaEm: null,
        reservaExpiraEm: null,
        pagamentoId: null,
      },
    })
  }

  // Cron job: expira reservas antigas
  async expirarReservas(): Promise<number> {
    const resultado = await this.db.cota.updateMany({
      where: {
        status: "RESERVADA" as any,
        reservaExpiraEm: { lt: new Date() },
      },
      data: {
        status: "DISPONIVEL" as any,
        usuarioId: null,
        reservadaEm: null,
        reservaExpiraEm: null,
      },
    })

    return resultado.count
  }

  async buscarPorUsuario(usuarioId: string, sorteioId?: string): Promise<any[]> {
    return this.db.cota.findMany({
      where: {
        usuarioId,
        status: "PAGA" as any,
        ...(sorteioId && { sorteioId }),
      },
      orderBy: { numero: 'asc' },
    })
  }

  async contarDisponiveis(sorteioId: string): Promise<number> {
    return this.db.cota.count({
      where: { sorteioId, status: "DISPONIVEL" as any },
    })
  }
}
