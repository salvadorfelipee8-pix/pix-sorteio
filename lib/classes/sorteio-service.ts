// lib/classes/sorteio-service.ts
// ⚠️ IMPACTO: Alterações aqui afetam CotaService, LotteryService e AdminDashboard

import { PrismaClient, Sorteio, StatusSorteio } from '@prisma/client'
import { AuditoriaService } from './auditoria-service'
import { createHash } from 'crypto'

export interface CriarSorteioDTO {
  titulo: string
  descricao?: string
  valorCota: number
  totalCotas: number
  dataApuracao: Date
  dataLoteria: Date
  premioDescricao: string
  premioValor: number
  certificadoSpaMf: string
  cnpjPromotora: string
  regulamentoUrl?: string
  dataAutorizacao?: Date
  loteriaSerie?: string
}

export class SorteioService {
  private db: PrismaClient
  private auditoria: AuditoriaService

  constructor(db: PrismaClient, auditoria: AuditoriaService) {
    this.db = db
    this.auditoria = auditoria
  }

  async criar(data: CriarSorteioDTO, adminId: string): Promise<Sorteio> {
    // Validação de compliance — sorteio sem certificado não é criado
    if (!data.certificadoSpaMf || data.certificadoSpaMf.trim() === '') {
      throw new Error('Certificado de Autorização SPA/MF é obrigatório.')
    }

    const slug = this.gerarSlug(data.titulo)

    const sorteio = await this.db.sorteio.create({
      data: {
        ...data,
        slug,
        valorCota: data.valorCota,
        premioValor: data.premioValor,
        status: StatusSorteio.RASCUNHO,
      },
    })

    await this.auditoria.registrar({
      usuarioId: adminId,
      sorteioId: sorteio.id,
      acao: 'SORTEIO_CRIADO',
      entidade: 'Sorteio',
      entidadeId: sorteio.id,
      payload: { titulo: sorteio.titulo, totalCotas: sorteio.totalCotas },
    })

    return sorteio
  }

  async ativar(sorteioId: string, adminId: string): Promise<Sorteio> {
    const sorteio = await this.buscarPorId(sorteioId)

    if (sorteio.status !== StatusSorteio.RASCUNHO) {
      throw new Error('Apenas sorteios em rascunho podem ser ativados.')
    }

    const atualizado = await this.db.sorteio.update({
      where: { id: sorteioId },
      data: { status: StatusSorteio.ATIVO },
    })

    await this.auditoria.registrar({
      usuarioId: adminId,
      sorteioId,
      acao: 'SORTEIO_ATIVADO',
      entidade: 'Sorteio',
      entidadeId: sorteioId,
    })

    return atualizado
  }

  // ⚠️ IMPACTO: Este método afeta CotaService (snapshot) e AuditoriaService (hash)
  async congelarBase(sorteioId: string, adminId: string): Promise<string> {
    const cotas = await this.db.cota.findMany({
      where: { sorteioId },
      orderBy: { numero: 'asc' },
      select: { numero: true, usuarioId: true, status: true },
    })

    const baseJson = JSON.stringify(cotas)
    const hash = createHash('sha256').update(baseJson).digest('hex')

    await this.db.sorteio.update({
      where: { id: sorteioId },
      data: {
        baseCongelada: true,
        baseCongeladaEm: new Date(),
        baseHashSha256: hash,
        status: StatusSorteio.AGUARDANDO_SORTEIO,
      },
    })

    await this.auditoria.registrar({
      usuarioId: adminId,
      sorteioId,
      acao: 'BASE_CONGELADA',
      entidade: 'Sorteio',
      entidadeId: sorteioId,
      payload: { hash, totalCotas: cotas.length },
    })

    return hash
  }

  async buscarAtivos(): Promise<Sorteio[]> {
    return this.db.sorteio.findMany({
      where: { status: StatusSorteio.ATIVO },
      orderBy: { dataApuracao: 'asc' },
    })
  }

  async buscarPorSlug(slug: string): Promise<Sorteio | null> {
    return this.db.sorteio.findUnique({ where: { slug } })
  }

  async buscarPorId(id: string): Promise<Sorteio> {
    const sorteio = await this.db.sorteio.findUnique({ where: { id } })
    if (!sorteio) throw new Error(`Sorteio ${id} não encontrado.`)
    return sorteio
  }

  private gerarSlug(titulo: string): string {
    return titulo
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      + '-' + Date.now().toString(36)
  }
}
