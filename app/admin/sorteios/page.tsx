'use client'
// app/admin/sorteios/page.tsx
// SorteioMax — Listagem de sorteios com ações: editar, ativar, congelar

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Plus,
  Pencil,
  Users,
  Lock,
  Loader2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react'

interface Sorteio {
  id: string
  slug: string
  titulo: string
  status: string
  valorCota: number
  totalCotas: number
  cotasVendidas: number
  dataApuracao: string
  baseCongelada: boolean
  baseCongeladaEm: string | null
  baseHashSha256: string | null
  criadoEm: string
}

const STATUS_COLORS: Record<string, string> = {
  RASCUNHO: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
  ATIVO: 'bg-[#00FFA3]/10 text-[#00FFA3] border-[#00FFA3]/30',
  ESGOTADO: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  AGUARDANDO_SORTEIO: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  FINALIZADO: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  CANCELADO: 'bg-red-500/10 text-red-400 border-red-500/30'
}

const STATUS_LABELS: Record<string, string> = {
  RASCUNHO: 'Rascunho',
  ATIVO: 'Ativo',
  ESGOTADO: 'Esgotado',
  AGUARDANDO_SORTEIO: 'Aguardando',
  FINALIZADO: 'Finalizado',
  CANCELADO: 'Cancelado'
}

export default function AdminSorteiosPage() {
  const [sorteios, setSorteios] = useState<Sorteio[]>([])
  const [loading, setLoading] = useState(true)
  const [congelandoId, setCongelandoId] = useState<string | null>(null)
  const [ativandoId, setAtivandoId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  function showToast(msg: string, type: 'success' | 'error') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  async function carregar() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/sorteios')
      const data = await res.json()
      setSorteios(data)
    } catch {
      showToast('Erro ao carregar sorteios', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [])

  async function ativarSorteio(id: string) {
    setAtivandoId(id)
    try {
      const res = await fetch(`/api/admin/sorteios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ATIVO' })
      })
      if (!res.ok) throw new Error()
      showToast('Sorteio ativado com sucesso', 'success')
      await carregar()
    } catch {
      showToast('Erro ao ativar sorteio', 'error')
    } finally {
      setAtivandoId(null)
    }
  }

  async function congelarBase(id: string, titulo: string) {
    if (!confirm(`Congelar base do sorteio "${titulo}"?\n\nEsta ação é irreversível e vai gerar o hash SHA-256 da lista de participantes.`)) return
    setCongelandoId(id)
    try {
      const res = await fetch(`/api/admin/sorteios/${id}/congelar`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      showToast(`Base congelada! Hash: ${data.hashSha256?.slice(0, 16)}...`, 'success')
      await carregar()
    } catch (e: any) {
      showToast(e.message ?? 'Erro ao congelar base', 'error')
    } finally {
      setCongelandoId(null)
    }
  }

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl border shadow-xl text-sm font-medium transition-all ${
            toast.type === 'success'
              ? 'bg-[#00FFA3]/10 border-[#00FFA3]/40 text-[#00FFA3]'
              : 'bg-red-500/10 border-red-500/40 text-red-400'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Sorteios</h1>
          <p className="text-zinc-500 text-sm mt-1">{sorteios.length} sorteio(s) cadastrado(s)</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={carregar}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <RefreshCw size={18} />
          </button>
          <Link
            href="/admin/sorteios/novo"
            className="flex items-center gap-2 bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-bold px-4 py-2 rounded-lg text-sm transition-all"
          >
            <Plus size={16} />
            Novo Sorteio
          </Link>
        </div>
      </div>

      {/* Tabela */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-[#FFD700]" size={28} />
        </div>
      ) : sorteios.length === 0 ? (
        <div className="bg-[#111111] border border-zinc-800 rounded-xl p-16 text-center">
          <p className="text-zinc-500">Nenhum sorteio cadastrado ainda.</p>
          <Link href="/admin/sorteios/novo" className="text-[#FFD700] hover:underline text-sm mt-2 inline-block">
            Criar primeiro sorteio →
          </Link>
        </div>
      ) : (
        <div className="bg-[#111111] border border-zinc-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left px-6 py-4 text-zinc-400 font-medium">Sorteio</th>
                  <th className="text-left px-4 py-4 text-zinc-400 font-medium">Status</th>
                  <th className="text-left px-4 py-4 text-zinc-400 font-medium">Cotas</th>
                  <th className="text-left px-4 py-4 text-zinc-400 font-medium">Valor</th>
                  <th className="text-left px-4 py-4 text-zinc-400 font-medium">Apuração</th>
                  <th className="text-left px-4 py-4 text-zinc-400 font-medium">Base</th>
                  <th className="text-right px-6 py-4 text-zinc-400 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {sorteios.map(s => {
                  const pct = Math.round((s.cotasVendidas / s.totalCotas) * 100)
                  return (
                    <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-white font-medium truncate max-w-[200px]">{s.titulo}</p>
                        <p className="text-zinc-600 text-xs">/{s.slug}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`text-xs px-2 py-1 rounded border font-medium ${STATUS_COLORS[s.status] ?? ''}`}>
                          {STATUS_LABELS[s.status] ?? s.status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="text-white">{s.cotasVendidas}/{s.totalCotas}</p>
                          <div className="h-1 bg-zinc-800 rounded-full mt-1 w-20">
                            <div className="h-full bg-[#FFD700] rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-white">{fmt(s.valorCota)}</td>
                      <td className="px-4 py-4 text-zinc-400 text-xs">
                        {new Date(s.dataApuracao).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-4">
                        {s.baseCongelada ? (
                          <div className="flex items-center gap-1.5 text-[#00FFA3] text-xs">
                            <Lock size={12} />
                            <span className="font-mono" title={s.baseHashSha256 ?? ''}>
                              {s.baseHashSha256?.slice(0, 8)}…
                            </span>
                          </div>
                        ) : (
                          <span className="text-zinc-600 text-xs">Aberta</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {/* Ativar (apenas rascunho) */}
                          {s.status === 'RASCUNHO' && (
                            <button
                              onClick={() => ativarSorteio(s.id)}
                              disabled={ativandoId === s.id}
                              className="text-xs px-3 py-1.5 rounded bg-[#00FFA3]/10 border border-[#00FFA3]/30 text-[#00FFA3] hover:bg-[#00FFA3]/20 transition-colors disabled:opacity-50"
                            >
                              {ativandoId === s.id ? <Loader2 size={12} className="animate-spin" /> : 'Ativar'}
                            </button>
                          )}

                          {/* Congelar base (apenas ativo/esgotado) */}
                          {(s.status === 'ATIVO' || s.status === 'ESGOTADO') && !s.baseCongelada && (
                            <button
                              onClick={() => congelarBase(s.id, s.titulo)}
                              disabled={congelandoId === s.id}
                              className="text-xs px-3 py-1.5 rounded bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20 transition-colors disabled:opacity-50 flex items-center gap-1"
                            >
                              {congelandoId === s.id ? <Loader2 size={12} className="animate-spin" /> : <Lock size={12} />}
                              Congelar
                            </button>
                          )}

                          {/* Participantes */}
                          <Link
                            href={`/admin/sorteios/${s.id}/participantes`}
                            className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                            title="Participantes"
                          >
                            <Users size={15} />
                          </Link>

                          {/* Editar */}
                          <Link
                            href={`/admin/sorteios/${s.id}/editar`}
                            className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                            title="Editar"
                          >
                            <Pencil size={15} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
