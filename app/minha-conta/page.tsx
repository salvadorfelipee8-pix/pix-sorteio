'use client'
// app/minha-conta/page.tsx
// SorteioMax — Área do participante: cotas compradas por sorteio

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Ticket, Trophy, Clock, Loader2, ExternalLink, Lock } from 'lucide-react'

interface CotaItem {
  id: string
  numero: number
  status: string
  pagamento: { valor: number; status: string; paidAt: string | null } | null
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
    imagemUrl: string | null
    cotaVencedora: number | null
    loteriaResultado: string | null
    baseHashSha256: string | null
  }
  cotas: CotaItem[]
}

const STATUS_SORTEIO_LABEL: Record<string, { label: string; color: string }> = {
  ATIVO:             { label: 'Ativo',            color: 'text-[#00FFA3]' },
  ESGOTADO:          { label: 'Esgotado',          color: 'text-blue-400' },
  AGUARDANDO_SORTEIO:{ label: 'Aguardando',        color: 'text-yellow-400' },
  FINALIZADO:        { label: 'Finalizado',         color: 'text-purple-400' },
  CANCELADO:         { label: 'Cancelado',          color: 'text-red-400' }
}

export default function MinhaContaPage() {
  const [grupos, setGrupos] = useState<SorteioGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/minha-conta/cotas')
      .then(r => {
        if (r.status === 401) throw new Error('not_authenticated')
        return r.json()
      })
      .then(setGrupos)
      .catch(e => {
        if (e.message === 'not_authenticated') {
          window.location.href = '/api/auth/signin'
        } else {
          setError('Erro ao carregar suas cotas.')
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#FFD700]" size={32} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D]">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-[#111111]">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-white text-2xl font-bold">Minha Conta</h1>
          <p className="text-zinc-500 text-sm mt-1">Suas cotas e participações</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">{error}</div>
        )}

        {grupos.length === 0 && !error ? (
          <div className="bg-[#111111] border border-zinc-800 rounded-2xl p-16 text-center">
            <Ticket size={40} className="text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-400 font-semibold">Nenhuma cota comprada ainda</p>
            <p className="text-zinc-600 text-sm mt-2">Participe de um sorteio para ver suas cotas aqui.</p>
            <Link href="/sorteios"
              className="mt-6 inline-block bg-[#FFD700] text-black font-bold px-6 py-2.5 rounded-xl hover:bg-[#FFD700]/90 transition-colors text-sm">
              Ver Sorteios
            </Link>
          </div>
        ) : (
          grupos.map(({ sorteio, cotas }) => {
            const statusInfo = STATUS_SORTEIO_LABEL[sorteio.status]
            const finalizado = sorteio.status === 'FINALIZADO'
            const cotasGanhadoras = cotas.filter(c => c.numero === sorteio.cotaVencedora)
            const ganhou = cotasGanhadoras.length > 0 && finalizado
            const totalPago = cotas.reduce((acc, c) => acc + (c.pagamento?.valor ?? 0), 0)

            return (
              <div
                key={sorteio.id}
                className={`bg-[#111111] border rounded-2xl overflow-hidden ${ganhou ? 'border-[#FFD700]/60' : 'border-zinc-800'}`}
              >
                {/* Card header */}
                <div className={`px-6 py-5 flex items-start justify-between gap-4 ${ganhou ? 'bg-[#FFD700]/5' : ''}`}>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {ganhou && <Trophy size={18} className="text-[#FFD700] shrink-0" />}
                      <h2 className="text-white font-bold text-lg truncate">{sorteio.titulo}</h2>
                    </div>
                    <p className="text-zinc-500 text-sm">{sorteio.premioDescricao}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs">
                      <span className={statusInfo?.color ?? 'text-zinc-400'}>{statusInfo?.label ?? sorteio.status}</span>
                      <span className="text-zinc-600">
                        Apuração: {new Date(sorteio.dataApuracao).toLocaleDateString('pt-BR')}
                      </span>
                      <span className="text-zinc-600">
                        {cotas.length} cota(s) — {fmt(totalPago)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {finalizado && (
                      <Link
                        href={`/sorteios/${sorteio.slug}/resultado`}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400 hover:bg-purple-500/20 transition-colors"
                      >
                        <ExternalLink size={12} /> Ver Resultado
                      </Link>
                    )}
                    <Link
                      href={`/sorteios/${sorteio.slug}`}
                      className="text-xs px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
                    >
                      Ver Sorteio
                    </Link>
                  </div>
                </div>

                {/* Ganhou banner */}
                {ganhou && (
                  <div className="mx-6 mb-4 bg-[#FFD700]/10 border border-[#FFD700]/40 rounded-xl p-4 text-center">
                    <p className="text-[#FFD700] font-bold text-lg">🏆 VOCÊ GANHOU!</p>
                    <p className="text-zinc-400 text-sm mt-1">
                      Sua cota <strong className="text-[#FFD700]">#{String(sorteio.cotaVencedora).padStart(4, '0')}</strong> foi a vencedora.
                    </p>
                  </div>
                )}

                {/* Cotas grid */}
                <div className="px-6 pb-6">
                  <p className="text-zinc-500 text-xs uppercase tracking-wider mb-3">Seus Números</p>
                  <div className="flex flex-wrap gap-2">
                    {cotas.map(c => {
                      const ehVencedora = finalizado && c.numero === sorteio.cotaVencedora
                      const paga = c.status === 'PAGA'
                      return (
                        <div
                          key={c.id}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold border ${
                            ehVencedora
                              ? 'bg-[#FFD700] text-black border-[#FFD700]'
                              : paga
                              ? 'bg-[#00FFA3]/10 text-[#00FFA3] border-[#00FFA3]/30'
                              : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
                          }`}
                        >
                          {ehVencedora && <Trophy size={12} />}
                          {!paga && <Clock size={12} />}
                          #{String(c.numero).padStart(4, '0')}
                        </div>
                      )
                    })}
                  </div>

                  {/* Hash de auditoria */}
                  {finalizado && sorteio.baseHashSha256 && (
                    <div className="mt-4 flex items-center gap-2 text-xs text-zinc-600">
                      <Lock size={11} />
                      <span className="font-mono">{sorteio.baseHashSha256.slice(0, 20)}…</span>
                      <span>— hash de auditoria</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
