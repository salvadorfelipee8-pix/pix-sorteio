// lib/container.ts
// SorteioMax — Injeção de dependência centralizada
// IMPACTO: Qualquer novo serviço deve ser registrado aqui

import { prisma } from './prisma'
import { AuditoriaService }    from './classes/auditoria-service'
import { AuthService }         from './classes/auth-service'
import { SorteioService }      from './classes/sorteio-service'
import { CotaService }         from './classes/cota-service'
import { PagamentoService }    from './classes/pagamento-service'
import { LotteryService }      from './classes/lottery-service'
import { NotificacaoService }  from './classes/notificacao-service'

// Singleton por request (serverless-safe)
export function criarContainer() {
  const auditoria    = new AuditoriaService(prisma)
  const auth         = new AuthService(prisma, auditoria)
  const sorteio      = new SorteioService(prisma, auditoria)
  const cota         = new CotaService(prisma, auditoria)
  const pagamento    = new PagamentoService(prisma, auditoria)
  const lottery      = new LotteryService()
  const notificacao  = new NotificacaoService()

  return { auditoria, auth, sorteio, cota, pagamento, lottery, notificacao, prisma }
}

export type Container = ReturnType<typeof criarContainer>
