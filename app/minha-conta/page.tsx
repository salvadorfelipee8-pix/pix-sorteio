'use client'
// app/minha-conta/page.tsx
// SorteioMax — Área do participante

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/ui/Navbar'
import { Footer } from '@/components/ui/Footer'
import { Ticket, Trophy, ExternalLink, Lock, LogOut, Loader2 } from 'lucide-react'

interface CotaItem {
  id: string
  numero: number
  status: string
  pagamento: { id: string; valor: number; status: string; paidAt: string | null } | null
}

interface SorteioGroup {
  sorteio: {
    id: string
    slug: string
    titulo: string
    status: string
    dataApuracao: string
    premioDescricao: string
    premioValor: number
    valorCota: number
    imagemUrl: string | null
    cotaVencedora: number | null
    loteriaResultado: string | null
    baseHashSha256: string | null
  }
  cotas: CotaItem[]
}

interface ApiData {
  usuario: { nome: string; email: string }
  grupos: SorteioGroup[]
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  ATIVO:              { label: 'Ativo',            color: 'text-[#00FFA3]' },
  ESGOTADO:           { label: 'Esgotado',          color: 'text-blue-400' },
  AGUARDANDO_SORTEIO: { label: 'Aguardando Sorteio', color: 'text-yellow-400' },
  FINALIZADO:         { label: 'Finalizado',         color: 'text-purple-400' },
  CANCELADO:          { label: 'Cancelado',          color: 'text-red-400' },
}

export default function MinhaContaPage() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()

  const [data, setData]       = useState<ApiData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/minha-conta')
      return
    }
    if (sessionStatus !== 'authenticated') return

    fetch('/api/minha-conta/cotas')
      .then(r => {
        if (r.status === 401) throw new Error('unauth')
        return r.json()
      })
      .then((d: ApiData) => setData(d))
      .catch(e => {
        if (e.message === 'unauth') router.push('/auth/login?callbackUrl=/minha-conta')
        else setError('Erro ao carregar suas cotas. Tente recarregar a página.')
      })
      .finally(() => setLoading(false))
  }, [sessionStatus, router])

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  if (sessionStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <Loader2 className="animate-spin text-gold-DEFAULT" size={32} />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-bg-primary">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-28 pb-20">

        {/* Header da conta */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gold-gradient flex items-center justify-center text-black font-bold text-xl font-display shadow-gold-sm">
              {(session?.user?.name ?? '?')[0].toUpperCase()}
            </div>
            <div>
              <h1 className="font-display font-bold text-2xl text-white">{session?.user?.name ?? data?.usuario?.nome}</h1>
              <p className="text-text-muted text-sm">{session?.user?.email ?? data?.usuario?.email}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[rgba(255,77,77,0.3)] text-danger text-sm font-medium hover:bg-[rgba(255,77,77,0.05)] transition-colors"
          >
            <LogOut size={15} />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>

        {error && (
          <div className="bg-[rgba(255,77,77,0.1)] border border-[rgba(255,77,77,0.25)] rounded-xl p-4 text-danger text-sm mb-6">{error}</div>
        )}

        {/* Sem cotas */}
        {(!data?.grupos || data.grupos.length === 0) && !error && (
          <div className="glass rounded-2xl p-16 text-center">
            <div className="text-6xl mb-4 animate-float">🎟️</div>
            <h2 className="font-display font-bold text-xl text-white mb-2">Nenhuma cota comprada ainda</h2>
            <p className="text-text-muted text-sm mb-6">Participe de um sorteio e suas cotas aparecerão aqui.</p>
            <Link href="/sorteios" className="btn-primary px-8 py-3">
              Ver Sorteios Ativos
            </Link>
          </div>
        )}

        {/* Lista de grupos por sorteio */}
        <div className="space-y-5">
          {data?.grupos?.map(({ sorteio, cotas }) => {
            const statusInfo     = STATUS_LABEL[sorteio.status]
            const finalizado     = sorteio.status === 'FINALIZADO'
            const ganhou         = finalizado && cotas.some(c => c.numero === sorteio.cotaVencedora)
            const totalPago      = cotas.length * sorteio.valorCota

            return (
              <div
                key={sorteio.id}
                className={`glass rounded-2xl overflow-hidden ${ganhou ? 'border border-[rgba(255,215,0,0.4)]' : ''}`}
              >
                {/* Banner de vencedor */}
                {ganhou && (
                  <div className="bg-[rgba(255,215,0,0.12)] px-6 py-4 flex items-center gap-3 border-b border-[rgba(255,215,0,0.2)]">
                    <Trophy className="text-gold-DEFAULT shrink-0" size={20} />
                    <div>
                      <p className="text-gold-DEFAULT font-bold">Você ganhou!</p>
                      <p className="text-text-muted text-xs">
                        Sua cota #{String(sorteio.cotaVencedora).padStart(4, '0')} foi sorteada.
                      </p>
                    </div>
                  </div>
                )}

                {/* Header do card */}
                <div className="px-6 py-5 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="text-white font-bold text-lg truncate mb-1">{sorteio.titulo}</h2>
                    <p className="text-text-muted text-sm mb-2">{sorteio.premioDescricao}</p>
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      <span className={statusInfo?.color ?? 'text-text-muted'}>{statusInfo?.label ?? sorteio.status}</span>
                      <span className="text-text-muted">
                        Apuração: {new Date(sorteio.dataApuracao).toLocaleDateString('pt-BR')}
                      </span>
                      <span className="text-text-secondary font-semibold">
                        {cotas.length} cota{cotas.length !== 1 ? 's' : ''} · {fmt(totalPago)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {finalizado && (
                      <Link
                        href={`/sorteios/${sorteio.slug}/resultado`}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[rgba(168,85,247,0.1)] border border-[rgba(168,85,247,0.3)] text-purple-400 hover:bg-[rgba(168,85,247,0.15)] transition-colors"
                      >
                        <ExternalLink size={11} /> Resultado
                      </Link>
                    )}
                    <Link
                      href={`/sorteios/${sorteio.slug}`}
                      className="text-xs px-3 py-1.5 rounded-lg glass border border-[rgba(255,255,255,0.08)] text-text-muted hover:text-white transition-colors"
                    >
                      Ver Sorteio
                    </Link>
                  </div>
                </div>

                {/* Grid de cotas */}
                <div className="px-6 pb-6">
                  <p className="text-text-muted text-xs uppercase tracking-wider mb-3">Seus números da sorte</p>
                  <div className="flex flex-wrap gap-2">
                    {cotas.map(c => {
                      const ehVencedora = finalizado && c.numero === sorteio.cotaVencedora
                      return (
                        <span
                          key={c.id}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold border transition-all ${
                            ehVencedora
                              ? 'bg-gold-gradient text-black border-transparent shadow-gold-sm'
                              : 'bg-[rgba(0,255,163,0.08)] text-mint-DEFAULT border-[rgba(0,255,163,0.2)]'
                          }`}
                        >
                          {ehVencedora && <Trophy size={11} />}
                          #{String(c.numero).padStart(4, '0')}
                        </span>
                      )
                    })}
                  </div>

                  {finalizado && sorteio.baseHashSha256 && (
                    <div className="mt-4 flex items-center gap-2 text-xs text-text-muted">
                      <Lock size={11} />
                      <span className="font-mono">{sorteio.baseHashSha256.slice(0, 24)}…</span>
                      <span>hash de auditoria</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* CTA para comprar mais */}
        {data?.grupos && data.grupos.length > 0 && (
          <div className="mt-8 text-center">
            <Link href="/sorteios" className="btn-primary px-8 py-3 inline-flex items-center gap-2">
              <Ticket size={16} />
              Comprar mais cotas
            </Link>
          </div>
        )}
      </div>

      <Footer />
    </main>
  )
}
