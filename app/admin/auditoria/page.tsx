'use client'
// app/admin/auditoria/page.tsx
// SorteioMax — Logs de auditoria com exportação CSV

import { useEffect, useState } from 'react'
import { Loader2, Download, ClipboardList, Search, RefreshCw } from 'lucide-react'

interface Log {
  id: string
  acao: string
  entidade: string
  entidadeId: string | null
  payload: any
  ipAddress: string | null
  hashEstado: string | null
  criadoEm: string
  usuario: { email: string } | null
  sorteio: { titulo: string } | null
}

const ACAO_COLORS: Record<string, string> = {
  BASE_CONGELADA: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  SORTEIO_CRIADO: 'bg-[#00FFA3]/10 text-[#00FFA3] border-[#00FFA3]/30',
  SORTEIO_EDITADO: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  COTA_RESERVADA: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
  PAGAMENTO_CONFIRMADO: 'bg-[#FFD700]/10 text-[#FFD700] border-[#FFD700]/30'
}

export default function AuditoriaPage() {
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [exportando, setExportando] = useState(false)

  async function carregar() {
    setLoading(true)
    try {
      // Busca os últimos logs via API de auditoria (reusa a rota de export com formato json)
      const res = await fetch('/api/admin/auditoria/logs')
      if (res.ok) {
        const data = await res.json()
        setLogs(data)
      }
    } catch {
      // silencioso — tabela vazia
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [])

  function exportarCSV() {
    setExportando(true)
    window.open('/api/admin/auditoria/export', '_blank')
    setTimeout(() => setExportando(false), 2000)
  }

  const filtrados = logs.filter(l => {
    if (!busca) return true
    const q = busca.toLowerCase()
    return (
      l.acao.toLowerCase().includes(q) ||
      l.entidade.toLowerCase().includes(q) ||
      l.usuario?.email?.toLowerCase().includes(q) ||
      l.sorteio?.titulo?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Auditoria</h1>
          <p className="text-zinc-500 text-sm mt-1">Log imutável de todas as ações críticas</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={carregar} className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors">
            <RefreshCw size={18} />
          </button>
          <button
            onClick={exportarCSV}
            disabled={exportando}
            className="flex items-center gap-2 bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700] hover:bg-[#FFD700]/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {exportando ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
            Exportar CSV Completo
          </button>
        </div>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Filtrar por ação, entidade, usuário ou sorteio..."
          className="w-full bg-[#111111] border border-zinc-800 rounded-xl pl-11 pr-4 py-3 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-[#FFD700]/50 transition-colors"
        />
      </div>

      {/* Info box */}
      <div className="bg-[#FFD700]/5 border border-[#FFD700]/20 rounded-xl px-5 py-4 flex items-start gap-3">
        <ClipboardList size={18} className="text-[#FFD700] shrink-0 mt-0.5" />
        <div>
          <p className="text-[#FFD700] text-sm font-medium">Log de Auditoria Imutável</p>
          <p className="text-zinc-500 text-xs mt-0.5">
            Todos os registros são append-only (INSERT only). Nenhum log pode ser editado ou excluído.
            O hash SHA-256 garante integridade do estado anterior a cada ação crítica.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-[#FFD700]" size={28} /></div>
      ) : filtrados.length === 0 ? (
        <div className="bg-[#111111] border border-zinc-800 rounded-xl p-16 text-center">
          <ClipboardList size={32} className="text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-500">{busca ? 'Nenhum log encontrado para esta busca' : 'Nenhum log de auditoria ainda'}</p>
        </div>
      ) : (
        <div className="bg-[#111111] border border-zinc-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left px-6 py-4 text-zinc-400 font-medium">Ação</th>
                  <th className="text-left px-4 py-4 text-zinc-400 font-medium">Entidade</th>
                  <th className="text-left px-4 py-4 text-zinc-400 font-medium">Usuário</th>
                  <th className="text-left px-4 py-4 text-zinc-400 font-medium">Sorteio</th>
                  <th className="text-left px-4 py-4 text-zinc-400 font-medium">Hash</th>
                  <th className="text-left px-4 py-4 text-zinc-400 font-medium">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {filtrados.map(log => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded border font-medium ${ACAO_COLORS[log.acao] ?? 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                        {log.acao}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-white text-xs">{log.entidade}</p>
                      {log.entidadeId && <p className="text-zinc-600 text-xs font-mono">{log.entidadeId.slice(0, 12)}…</p>}
                    </td>
                    <td className="px-4 py-4 text-zinc-400 text-xs">{log.usuario?.email ?? '—'}</td>
                    <td className="px-4 py-4 text-zinc-400 text-xs truncate max-w-[140px]">{log.sorteio?.titulo ?? '—'}</td>
                    <td className="px-4 py-4">
                      {log.hashEstado ? (
                        <span className="font-mono text-xs text-zinc-500" title={log.hashEstado}>
                          {log.hashEstado.slice(0, 12)}…
                        </span>
                      ) : (
                        <span className="text-zinc-700 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-zinc-500 text-xs whitespace-nowrap">
                      {new Date(log.criadoEm).toLocaleString('pt-BR', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit', second: '2-digit'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 border-t border-zinc-800 text-zinc-600 text-xs">
            Exibindo {filtrados.length} de {logs.length} registros
          </div>
        </div>
      )}
    </div>
  )
}
