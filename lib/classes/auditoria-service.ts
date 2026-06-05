import { prisma as _prismaType } from '@/lib/prisma'
type PrismaClient = typeof _prismaType
// lib/classes/auditoria-service.ts
// ⚠️ IMPACTO: Chamado por TODOS os outros serviços — nunca remover chamadas de auditoria

import { createHash } from 'crypto'

export interface RegistrarAuditoriaDTO {
  usuarioId?: string
  sorteioId?: string
  acao: string
  entidade: string
  entidadeId?: string
  payload?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

export class AuditoriaService {
  private db: PrismaClient

  constructor(db: PrismaClient) {
    this.db = db
  }

  // INSERT only — nunca atualizar ou deletar logs
  async registrar(dto: RegistrarAuditoriaDTO): Promise<void> {
    const hashEstado = this.gerarHash(dto)

    await this.db.logAuditoria.create({
      data: {
        usuarioId:  dto.usuarioId,
        sorteioId:  dto.sorteioId,
        acao:       dto.acao,
        entidade:   dto.entidade,
        entidadeId: dto.entidadeId,
        payload:    dto.payload ?? {},
        ipAddress:  dto.ipAddress,
        userAgent:  dto.userAgent,
        hashEstado,
      },
    })
  }

  async buscarPorSorteio(sorteioId: string) {
    return this.db.logAuditoria.findMany({
      where: { sorteioId },
      orderBy: { criadoEm: 'desc' },
      include: { usuario: { select: { nome: true, email: true } } },
    })
  }

  async exportarCSV(sorteioId: string): Promise<string> {
    const logs = await this.buscarPorSorteio(sorteioId)

    const header = 'timestamp,usuario,acao,entidade,entidadeId,ip,hash\n'
    const rows = logs.map(l =>
      [
        l.criadoEm.toISOString(),
        l.usuario?.email ?? 'sistema',
        l.acao,
        l.entidade,
        l.entidadeId ?? '',
        l.ipAddress ?? '',
        l.hashEstado ?? '',
      ].join(',')
    ).join('\n')

    return header + rows
  }

  private gerarHash(dto: RegistrarAuditoriaDTO): string {
    const conteudo = JSON.stringify({
      ...dto,
      timestamp: Date.now(),
    })
    return createHash('sha256').update(conteudo).digest('hex')
  }
}
