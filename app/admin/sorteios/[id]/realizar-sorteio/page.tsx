'use client'
// app/admin/sorteios/[id]/realizar-sorteio/page.tsx
// SorteioMax — Painel de realização do sorteio com resultado da Loteria Federal

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Trophy, Loader2, CheckCircle2,
  AlertTriangle, Lock, Search, Zap
} from 'lucide-react'

const inputCls = "w-full bg-[#0D0D0D] border border-zinc-800 rounded-lg px-4 py-2.5 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-[#FFD700]/50 transition-colors"

export default function RealizarSorteioPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [sorteio, setSorteio] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [realizando, setRealizando] = useState(false)
  const [resultado, setResultado] = useState<any>(null)
  const [error, setError] = useState('')

  const [modo, setModo] = useState<'automatico' | 'manual'>('automatico')
  const [numeroLoteria, setNumeroLoteria] = useState('')
  const [serie, setSerie] = useState('1')
  const [dataLoteria, setDataLoteria] = useState('')

  useEffect(() => {
    fetch(`/api/admin/sorteios/${id}`)
      .then(r => r.json())
      .then(d => {
        setSorteio(d)
        if (d.dataLoteria) setDataLoteria(new Date(d.dataLoteria).toISOString().slice(0, 10))
        if (d.loteriaSerie) setSerie(d.loteriaSerie)
      })
      .finally(() => setLoading(false))
  }, [id])

  async function handleRealizar() {
    if (!confirm('Confirmar realização do sorteio?\n\nEsta ação é irreversível.')) return
    setRealizando(true)
    setError('')

    try {
      const body = modo === 'automatico'
        ? { buscarAutomatico: true, dataLoteria, serie }
        : { numeroLoteria, serie, buscarAutomatico: false }

      const res = await fetch(`/api/admin/sorteios/${id}/realizar-sorteio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResultado(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setRealizando(false)
    }
  }

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-[#FFD700]" size={28} /></div>

  if (resultado) {
    return (
      <div className="max-w-2xl space-y-6">
        <div className="bg-[#FFD700]/10 border border-[#FFD700]/40 rounded-2xl p-8 text-center">
          <Trophy className="text-[#FFD700] mx-auto mb-4" size={56} />
          <h1 className="text-white text-3xl font-bold mb-2">Sorteio Realizado!</h1>
          <p className="text-zinc-400 mb-6">Resultado registrado com sucesso na blockchain de auditoria.</p>

          <div className="bg-[#0D0D0D] rounded-xl p-6 mb-6 text-left space-y-4">
            <div className="text-center mb-4">
              <p className="text-zinc-500 text-xs uppercase tracking-wider mb-2">Cota Vencedora</p>
              <span className="text-5xl font-black text-[#FFD700]">
                #{String(resultado.cotaVencedora).padStart(4, '0')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Número Loteria</p>
                <p className="text-white font-bold text-lg">{resultado.numeroLoteria}</p>
              </div>
              <div>
                <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Série</p>
                <p className="text-white font-bold text-lg">{resultado.serie}</p>
              </div>
            </div>

            {resultado.vencedor ? (
              <div className="bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-lg p-4">
                <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Vencedor</p>
                <p className="text-white font-bold">{resultado.vencedor.nome}</p>
                <p className="text-zinc-400 text-sm">{resultado.vencedor.email}</p>
              </div>
            ) : (
              <div className="bg-zinc-800 rounded-lg p-4">
                <p className="text-zinc-400 text-sm">Cota vencedora não possui dono registrado.</p>
              </div>
            )}

            <div>
              <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Hash de Verificação</p>
              <p className="text-zinc-400 font-mono text-xs break-all">{resultado.hashVerificacao}</p>
            </div>

            <div>
              <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Algoritmo</p>
              <p className="text-zinc-400 text-xs">{resultado.algoritmo}</p>
            </div>
          </div>

          <p className="text-zinc-500 text-sm mb-4">
            {resultado.totalNotificados} participante(s) notificado(s) por email.
          </p>

          <Link href="/admin/sorteios"
            className="inline-block bg-[#FFD700] text-black font-bold px-8 py-3 rounded-xl hover:bg-[#FFD700]/90 transition-colors">
            Voltar aos Sorteios
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/sorteios" className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-white text-2xl font-bold">Realizar Sorteio</h1>
          <p className="text-zinc-500 text-sm">{sorteio?.titulo}</p>
        </div>
      </div>

      {/* Verificações */}
      <div className="space-y-3">
        <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-sm ${sorteio?.baseCongelada ? 'bg-[#00FFA3]/5 border-[#00FFA3]/30 text-[#00FFA3]' : 'bg-red-500/5 border-red-500/30 text-red-400'}`}>
          <Lock size={16} />
          {sorteio?.baseCongelada
            ? `Base congelada em ${new Date(sorteio.baseCongeladaEm).toLocaleString('pt-BR')}`
            : 'Base ainda não foi congelada — congele antes de prosseguir'}
        </div>
        <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-sm ${sorteio?.status === 'AGUARDANDO_SORTEIO' ? 'bg-yellow-500/5 border-yellow-500/30 text-yellow-400' : 'bg-zinc-800 border-zinc-700 text-zinc-500'}`}>
          <Trophy size={16} />
          Status: {sorteio?.status}
        </div>
      </div>

      {sorteio?.baseCongelada && sorteio?.status !== 'FINALIZADO' && (
        <div className="bg-[#111111] border border-zinc-800 rounded-xl p-6 space-y-5">
          <h2 className="text-white font-semibold">Resultado da Loteria Federal</h2>

          {/* Modo */}
          <div className="flex gap-3">
            <button
              onClick={() => setModo('automatico')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors flex items-center justify-center gap-2 ${modo === 'automatico' ? 'bg-[#FFD700]/10 border-[#FFD700]/40 text-[#FFD700]' : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'}`}
            >
              <Zap size={15} /> Buscar Automaticamente
            </button>
            <button
              onClick={() => setModo('manual')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors flex items-center justify-center gap-2 ${modo === 'manual' ? 'bg-[#FFD700]/10 border-[#FFD700]/40 text-[#FFD700]' : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'}`}
            >
              <Search size={15} /> Informar Manualmente
            </button>
          </div>

          {modo === 'automatico' ? (
            <div>
              <label className="block text-zinc-400 text-xs font-medium mb-2 uppercase tracking-wider">Data do Sorteio Loteria</label>
              <input type="date" className={inputCls} value={dataLoteria} onChange={e => setDataLoteria(e.target.value)} />
              <p className="text-zinc-600 text-xs mt-2">O sistema buscará o resultado na API oficial da Caixa Econômica Federal.</p>
            </div>
          ) : (
            <div>
              <label className="block text-zinc-400 text-xs font-medium mb-2 uppercase tracking-wider">Número Sorteado pela Caixa</label>
              <input className={inputCls} value={numeroLoteria} onChange={e => setNumeroLoteria(e.target.value)} placeholder="Ex: 12345" />
            </div>
          )}

          <div>
            <label className="block text-zinc-400 text-xs font-medium mb-2 uppercase tracking-wider">Série / Prêmio</label>
            <select className={inputCls} value={serie} onChange={e => setSerie(e.target.value)}>
              {[1,2,3,4,5].map(n => (
                <option key={n} value={String(n)}>{n}º Prêmio</option>
              ))}
            </select>
          </div>

          {/* Hash info */}
          {sorteio?.baseHashSha256 && (
            <div className="bg-[#0D0D0D] border border-zinc-800 rounded-lg p-4">
              <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Hash SHA-256 da Base</p>
              <p className="text-zinc-400 font-mono text-xs break-all">{sorteio.baseHashSha256}</p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
              <AlertTriangle size={15} /> {error}
            </div>
          )}

          <button
            onClick={handleRealizar}
            disabled={realizando || (modo === 'automatico' ? !dataLoteria : !numeroLoteria)}
            className="w-full bg-[#FFD700] hover:bg-[#FFD700]/90 disabled:opacity-50 text-black font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            {realizando ? <Loader2 size={18} className="animate-spin" /> : <Trophy size={18} />}
            {realizando ? 'Realizando Sorteio...' : 'Realizar Sorteio Agora'}
          </button>

          <p className="text-zinc-600 text-xs text-center">
            Esta ação é irreversível. Todos os participantes serão notificados por email.
          </p>
        </div>
      )}

      {sorteio?.status === 'FINALIZADO' && (
        <div className="bg-[#111111] border border-zinc-800 rounded-xl p-6 text-center">
          <CheckCircle2 className="text-[#00FFA3] mx-auto mb-3" size={40} />
          <p className="text-white font-semibold">Sorteio já realizado</p>
          <p className="text-zinc-500 text-sm mt-1">Cota vencedora: <strong className="text-[#FFD700]">#{String(sorteio.cotaVencedora).padStart(4,'0')}</strong></p>
        </div>
      )}
    </div>
  )
}
