'use client'
// app/admin/sorteios/[id]/participantes/page.tsx
// SorteioMax — Listagem de participantes de um sorteio

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Download, Users, Search } from 'lucide-react'

interface Participante {
  numero: number
  status: string
  usuario: { id: string; nome: string; email: string; telefone: string | null } | null
  pagamento: { id: string; valor: number; status: string; paidAt: string | null } | null
}

const STATUS_COTA: Record<string, string> = {
  PAGA: 'bg-[#00FFA3]/10 text-[#00FFA3] border-[#00FFA3]/30',
  RESERVADA: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
}

export default function ParticipantesPage() {
  const { id } = useParams<{ id: string }>()
  const [participantes, setParticipantes] = useState<Participante[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/admin/sorteios/${id}/participantes`)
      .then(r => r.json())
      .then(setParticipantes)
      .catch(() => setError('Erro ao carregar participantes'))
      .finally(() => setLoading(false))
  }, [id])

  const filtrados = participantes.filter(p => {
    if (!busca) return true
    const q = busca.toLowerCase()
    return (
      String(p.numero).includes(q) ||
      p.usuario?.nome?.toLowerCase().includes(q) ||
      p.usuario?.email?.toLowerCase().includes(q)
    )
  })

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  function exportarCSV() {
    window.open(`/api/admin/auditoria/export?sorteioId=${id}`, '_blank')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/sorteios" className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-white text-2xl font-bold">Participantes</h1>
            <p className="text-zinc-500 text-sm">{participantes.length} cota(s) reservada(s)/paga(s)</p>
          </div>
        </div>
        <button
          onClick={exportarCSV}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors text-sm"
        >
          <Download size={15} />
          Exportar Auditoria
        </button>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar por número, nome ou email..."
          className="w-full bg-[#111111] border border-zinc-800 rounded-xl pl-11 pr-4 py-3 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-[#FFD700]/50 transition-colors"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-[#FFD700]" size={28} /></div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-red-400">{error}</div>
      ) : filtrados.length === 0 ? (
        <div className="bg-[#111111] border border-zinc-800 rounded-xl p-16 text-center">
          <Users size={32} className="text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-500">{busca ? 'Nenhum resultado encontrado' : 'Sem participantes ainda'}</p>
        </div>
      ) : (
        <div className="bg-[#111111] border border-zinc-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left px-6 py-4 text-zinc-400 font-medium w-20">Cota</th>
                  <th className="text-left px-4 py-4 text-zinc-400 font-medium">Status</th>
                  <th className="text-left px-4 py-4 text-zinc-400 font-medium">Participante</th>
                  <th className="text-left px-4 py-4 text-zinc-400 font-medium">Contato</th>
                  <th className="text-left px-4 py-4 text-zinc-400 font-medium">Valor Pago</th>
                  <th className="text-left px-4 py-4 text-zinc-400 font-medium">Data Pagamento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {filtrados.map(p => (
                  <tr key={p.numero} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-[#FFD700] font-bold font-mono">#{String(p.numero).padStart(4, '0')}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-xs px-2 py-1 rounded border font-medium ${STATUS_COTA[p.status] ?? 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-white font-medium">{p.usuario?.nome ?? '—'}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-zinc-400 text-xs">{p.usuario?.email ?? '—'}</p>
                      {p.usuario?.telefone && (
                        <p className="text-zinc-600 text-xs">{p.usuario.telefone}</p>
                      )}
                    </td>
                    <td className="px-4 py-4 text-white">
                      {p.pagamento ? fmt(p.pagamento.valor) : '—'}
                    </td>
                    <td className="px-4 py-4 text-zinc-400 text-xs">
                      {p.pagamento?.paidAt
                        ? new Date(p.pagamento.paidAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
