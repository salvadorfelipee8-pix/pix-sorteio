'use client'
// app/admin/page.tsx
// SorteioMax — Dashboard admin com métricas em tempo real

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  DollarSign,
  Ticket,
  Trophy,
  BarChart3,
  ArrowRight,
  Loader2,
  TrendingUp,
  Lock
} from 'lucide-react'

interface Metricas {
  totalArrecadado: number
  cotasVendidas: number
  sorteiosAtivos: number
  sorteiosTotal: number
  ticketMedio: number
  ultimosSorteios: Array<{
    id: string
    titulo: string
    status: string
    cotasVendidas: number
    totalCotas: number
    valorCota: number
    dataApuracao: string
  }>
}

const STATUS_COLORS: Record<string, string> = {
  RASCUNHO: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
  ATIVO: 'bg-[#00FFA3]/10 text-[#00FFA3] border-[#00FFA3]/30',
  ESGOTADO: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  AGUARDANDO_SORTEIO: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  FINALIZADO: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  CANCELADO: 'bg-red-500/10 text-red-400 border-red-500/30'
}

function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
  color = '#FFD700'
}: {
  icon: any
  label: string
  value: string
  sub?: string
  color?: string
}) {
  return (
    <div className="bg-[#111111] border border-zinc-800 rounded-xl p-6 hover:border-[#FFD700]/30 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ background: `${color}15`, border: `1px solid ${color}30` }}
        >
          <Icon size={20} style={{ color }} />
        </div>
      </div>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      <p className="text-zinc-500 text-sm">{label}</p>
      {sub && <p className="text-zinc-600 text-xs mt-1">{sub}</p>}
    </div>
  )
}

export default function AdminDashboardPage() {
  const [metricas, setMetricas] = useState<Metricas | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/metrics')
      .then(r => r.json())
      .then(setMetricas)
      .catch(() => setError('Erro ao carregar métricas'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-[#FFD700]" size={32} />
      </div>
    )
  }

  if (error || !metricas) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-red-400">
        {error || 'Erro ao carregar dados'}
      </div>
    )
  }

  const fmt = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-white text-2xl font-bold">Dashboard</h1>
        <p className="text-zinc-500 text-sm mt-1">Visão geral da plataforma SorteioMax</p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          icon={DollarSign}
          label="Total Arrecadado"
          value={fmt(metricas.totalArrecadado)}
          sub="pagamentos confirmados"
          color="#FFD700"
        />
        <MetricCard
          icon={Ticket}
          label="Cotas Vendidas"
          value={metricas.cotasVendidas.toLocaleString('pt-BR')}
          sub={`ticket médio ${fmt(metricas.ticketMedio)}`}
          color="#00FFA3"
        />
        <MetricCard
          icon={Trophy}
          label="Sorteios Ativos"
          value={String(metricas.sorteiosAtivos)}
          sub={`${metricas.sorteiosTotal} no total`}
          color="#00FFA3"
        />
        <MetricCard
          icon={TrendingUp}
          label="Ticket Médio"
          value={fmt(metricas.ticketMedio)}
          sub="por cota vendida"
          color="#FFD700"
        />
      </div>

      {/* Últimos sorteios */}
      <div className="bg-[#111111] border border-zinc-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <BarChart3 size={18} className="text-[#FFD700]" />
            <h2 className="text-white font-semibold">Últimos Sorteios</h2>
          </div>
          <Link
            href="/admin/sorteios"
            className="text-[#FFD700] text-sm hover:underline flex items-center gap-1"
          >
            Ver todos <ArrowRight size={14} />
          </Link>
        </div>

        {metricas.ultimosSorteios.length === 0 ? (
          <div className="px-6 py-12 text-center text-zinc-600">Nenhum sorteio cadastrado</div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {metricas.ultimosSorteios.map(s => {
              const pct = Math.round((s.cotasVendidas / s.totalCotas) * 100)
              return (
                <div key={s.id} className="px-6 py-4 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-white font-medium truncate">{s.titulo}</p>
                      <p className="text-zinc-500 text-xs mt-0.5">
                        {new Date(s.dataApuracao).toLocaleDateString('pt-BR')} — {fmt(s.valorCota)}/cota
                      </p>
                    </div>
                    <span
                      className={`shrink-0 text-xs px-2 py-1 rounded border font-medium ${STATUS_COLORS[s.status] ?? 'bg-zinc-800 text-zinc-400'}`}
                    >
                      {s.status}
                    </span>
                  </div>
                  {/* Barra de progresso */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-zinc-500 mb-1">
                      <span>{s.cotasVendidas}/{s.totalCotas} cotas</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#FFD700] rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Ações rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/admin/sorteios/novo"
          className="bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-xl p-5 hover:bg-[#FFD700]/15 transition-colors group"
        >
          <Ticket size={20} className="text-[#FFD700] mb-3" />
          <p className="text-white font-semibold text-sm">Novo Sorteio</p>
          <p className="text-zinc-500 text-xs mt-1">Criar sorteio do zero</p>
        </Link>
        <Link
          href="/admin/sorteios"
          className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-5 hover:bg-zinc-800 transition-colors"
        >
          <BarChart3 size={20} className="text-zinc-400 mb-3" />
          <p className="text-white font-semibold text-sm">Gerenciar Sorteios</p>
          <p className="text-zinc-500 text-xs mt-1">Editar, ativar, congelar</p>
        </Link>
        <Link
          href="/admin/auditoria"
          className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-5 hover:bg-zinc-800 transition-colors"
        >
          <Lock size={20} className="text-zinc-400 mb-3" />
          <p className="text-white font-semibold text-sm">Logs de Auditoria</p>
          <p className="text-zinc-500 text-xs mt-1">Exportar CSV completo</p>
        </Link>
      </div>
    </div>
  )
}
