// lib/classes/congelamento-service.ts
// SorteioMax — Serviço de congelamento de base com hash SHA-256
// IMPACTO: Impacta CotaService (bloqueia compras), SorteioService

import { createHash } from 'crypto'
import { prisma } from '@/lib/prisma'

export interface CongelamentoResult {
  success: boolean
  hashSha256?: string
  totalCotas?: number
  cotasPagas?: number
  erro?: string
}

export interface BaseSnapshot {
  sorteioId: string
  geradoEm: string
  totalCotas: number
  cotasPagas: number
  cotas: Array<{
    numero: number
    status: string
    usuarioId: string | null
    pagamentoId: string | null
    paidAt: string | null
  }>
}

export class CongelamentoService {
  async congelarBase(sorteioId: string, adminEmail: string): Promise<CongelamentoResult> {
    const sorteio = await prisma.sorteio.findUnique({
      where: { id: sorteioId },
      include: {
        cotas: {
          include: {
            pagamento: { select: { paidAt: true } }
          },
          orderBy: { numero: 'asc' }
        }
      }
    })

    if (!sorteio) {
      return { success: false, erro: 'Sorteio não encontrado' }
    }

    if (sorteio.baseCongelada) {
      return { success: false, erro: 'Base já foi congelada' }
    }

    const snapshot: BaseSnapshot = {
      sorteioId: sorteio.id,
      geradoEm: new Date().toISOString(),
      totalCotas: sorteio.totalCotas,
      cotasPagas: sorteio.cotasVendidas,
      cotas: sorteio.cotas.map((c: any) => ({
        numero: c.numero,
        status: c.status,
        usuarioId: c.usuarioId,
        pagamentoId: c.pagamentoId,
        paidAt: c.pagamento?.paidAt?.toISOString() ?? null
      }))
    }

    const jsonCanonico = JSON.stringify(snapshot, null, 0)
    const hash = createHash('sha256').update(jsonCanonico).digest('hex')

    await prisma.$transaction(async (tx: any) => {
      await tx.sorteio.update({
        where: { id: sorteioId },
        data: {
          baseCongelada: true,
          baseCongeladaEm: new Date(),
          baseHashSha256: hash,
          status: 'AGUARDANDO_SORTEIO'
        }
      })

      await tx.logAuditoria.create({
        data: {
          sorteioId,
          acao: 'BASE_CONGELADA',
          entidade: 'Sorteio',
          entidadeId: sorteioId,
          payload: {
            hash,
            adminEmail,
            totalCotas: snapshot.totalCotas,
            cotasPagas: snapshot.cotasPagas,
            geradoEm: snapshot.geradoEm
          } as any,
          hashEstado: hash
        }
      })
    })

    return {
      success: true,
      hashSha256: hash,
      totalCotas: snapshot.totalCotas,
      cotasPagas: snapshot.cotasPagas
    }
  }
}
