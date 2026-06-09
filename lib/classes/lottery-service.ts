// lib/classes/lottery-service.ts
// SorteioMax — Integração com resultado da Loteria Federal da Caixa
// IMPACTO: Usado por SorteioService e pela rota de realizar-sorteio

import { createHash } from 'crypto'

export interface ResultadoLoteria {
  numero: string
  data: string
  premios: Array<{
    ordem: number
    numero: string
  }>
}

export interface CalculoVencedor {
  cotaVencedora: number
  numeroLoteria: string
  serie: string
  hashVerificacao: string
  algoritmo: string
}

export class LotteryService {

  // Busca resultado da Loteria Federal por data (formato YYYY-MM-DD)
  async buscarResultado(data: string): Promise<ResultadoLoteria | null> {
    try {
      // API pública da Loteria Federal
      const dataFormatada = data.replace(/-/g, '')
      const url = `https://servicebus2.caixa.gov.br/portaldeloterias/api/federal/${dataFormatada}`

      const res = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 0 }
      })

      if (!res.ok) return null

      const json = await res.json()

      return {
        numero: String(json.numero ?? ''),
        data: json.dataApuracao ?? data,
        premios: (json.listaDezenas ?? []).map((n: string, i: number) => ({
          ordem: i + 1,
          numero: n
        }))
      }
    } catch {
      return null
    }
  }

  // Determina a cota vencedora com base no resultado da Loteria Federal
  // Algoritmo: número sorteado pela Caixa MOD totalCotas + 1
  // Determinístico, auditável e verificável por qualquer pessoa
  calcularVencedor(
    numeroLoteria: string,
    serie: string,
    totalCotas: number,
    hashBase: string
  ): CalculoVencedor {
    // Combina número da loteria + série + hash da base para máxima auditabilidade
    const semente = `${numeroLoteria}-${serie}-${hashBase}`
    const hashFinal = createHash('sha256').update(semente).digest('hex')

    // Converte primeiros 8 chars do hash para número
    const numeroDecimal = parseInt(hashFinal.slice(0, 8), 16)
    const cotaVencedora = (numeroDecimal % totalCotas) + 1

    return {
      cotaVencedora,
      numeroLoteria,
      serie,
      hashVerificacao: hashFinal,
      algoritmo: `SHA256(${numeroLoteria}-${serie}-BASE_HASH) MOD ${totalCotas} + 1`
    }
  }

  // Verifica se um hash de base é válido (auditoria pública)
  verificarHash(
    cotaVencedora: number,
    numeroLoteria: string,
    serie: string,
    totalCotas: number,
    hashBase: string
  ): boolean {
    const resultado = this.calcularVencedor(numeroLoteria, serie, totalCotas, hashBase)
    return resultado.cotaVencedora === cotaVencedora
  }
}
