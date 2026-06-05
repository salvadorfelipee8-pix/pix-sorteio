// lib/classes/lottery-service.ts
// ⚠️ IMPACTO: Alterações aqui afetam SorteioService e NotificacaoService

const CAIXA_API_URL = 'https://servicebus2.caixa.gov.br/portaldeloterias/api/federal'
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hora

export interface LotteryResult {
  concurso: number
  data: string
  premios: string[]  // [1o, 2o, 3o, 4o, 5o] — 5 dígitos cada
  fonte: string
}

export interface WinnerResult {
  numeroCota: number
  resultadoLoteria: string
  concurso: number
  serie: number  // 1 = 1o prêmio, etc.
  calculo: string // descrição legível do cálculo
}

// Cache simples em memória (em produção usar Redis)
const cache = new Map<string, { data: LotteryResult; timestamp: number }>()

export class LotteryService {

  async buscarResultado(concurso?: number): Promise<LotteryResult> {
    const cacheKey = concurso ? `concurso-${concurso}` : 'latest'
    const cached = cache.get(cacheKey)

    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data
    }

    const url = concurso
      ? `${CAIXA_API_URL}/${concurso}`
      : CAIXA_API_URL

    let tentativas = 0
    const MAX_TENTATIVAS = 3

    while (tentativas < MAX_TENTATIVAS) {
      try {
        const res = await fetch(url, {
          headers: { 'Accept': 'application/json' },
          next: { revalidate: 3600 },
        })

        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const json = await res.json()
        const result = this.parsearResultado(json)

        cache.set(cacheKey, { data: result, timestamp: Date.now() })
        return result

      } catch (err) {
        tentativas++
        if (tentativas === MAX_TENTATIVAS) {
          throw new Error(
            `Falha ao buscar resultado da Loteria Federal após ${MAX_TENTATIVAS} tentativas.`
          )
        }
        // Backoff exponencial: 1s, 2s, 4s
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, tentativas - 1)))
      }
    }

    throw new Error('Erro inesperado ao buscar resultado.')
  }

  // Determina a cota vencedora com base no resultado da Loteria Federal
  // Lógica: pega os 3 últimos dígitos do prêmio selecionado, aplica módulo
  determinarVencedor(
    resultado: LotteryResult,
    totalCotas: number,
    serie: number = 1  // 1 = 1o prêmio (padrão)
  ): WinnerResult {
    if (serie < 1 || serie > 5) {
      throw new Error('Série deve ser entre 1 e 5.')
    }

    const premioNumero = resultado.premios[serie - 1]

    if (!premioNumero || premioNumero.length < 3) {
      throw new Error('Resultado inválido da Loteria Federal.')
    }

    // Pega os 3 últimos dígitos (ex: "47382" → "382" → 382)
    const ultimos3 = parseInt(premioNumero.slice(-3), 10)

    // Aplica módulo para garantir que cai dentro do range de cotas
    // Soma 1 porque cotas começam em 1 (não 0)
    const numeroCota = (ultimos3 % totalCotas) + 1

    const calculo = [
      `Resultado ${serie}º prêmio: ${premioNumero}`,
      `3 últimos dígitos: ${ultimos3}`,
      `Total de cotas: ${totalCotas}`,
      `Cálculo: (${ultimos3} % ${totalCotas}) + 1 = ${numeroCota}`,
      `Cota vencedora: #${numeroCota}`,
    ].join(' | ')

    return {
      numeroCota,
      resultadoLoteria: premioNumero,
      concurso: resultado.concurso,
      serie,
      calculo,
    }
  }

  private parsearResultado(json: any): LotteryResult {
    // Adaptar conforme resposta real da API da Caixa
    return {
      concurso: json.numero || json.concurso,
      data: json.dataApuracao || json.data,
      premios: json.listaDezenas || json.premios || [],
      fonte: 'https://loterias.caixa.gov.br/federal',
    }
  }
}
