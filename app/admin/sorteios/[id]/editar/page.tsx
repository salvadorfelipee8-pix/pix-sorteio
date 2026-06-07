'use client'
// app/admin/sorteios/[id]/editar/page.tsx
// SorteioMax — Editar sorteio existente

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'

const inputCls = "w-full bg-[#0D0D0D] border border-zinc-800 rounded-lg px-4 py-2.5 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-[#FFD700]/50 transition-colors"

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-zinc-400 text-xs font-medium mb-2 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  )
}

const STATUS_OPTIONS = [
  { value: 'RASCUNHO', label: 'Rascunho' },
  { value: 'ATIVO', label: 'Ativo' },
  { value: 'ESGOTADO', label: 'Esgotado' },
  { value: 'AGUARDANDO_SORTEIO', label: 'Aguardando Sorteio' },
  { value: 'FINALIZADO', label: 'Finalizado' },
  { value: 'CANCELADO', label: 'Cancelado' }
]

export default function EditarSorteioPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [form, setForm] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  function set(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  useEffect(() => {
    fetch(`/api/admin/sorteios/${id}`)
      .then(r => r.json())
      .then(data => {
        setForm({
          titulo: data.titulo ?? '',
          descricao: data.descricao ?? '',
          imagemUrl: data.imagemUrl ?? '',
          valorCota: String(data.valorCota ?? ''),
          totalCotas: String(data.totalCotas ?? ''),
          premioDescricao: data.premioDescricao ?? '',
          premioValor: String(data.premioValor ?? ''),
          status: data.status ?? 'RASCUNHO',
          certificadoSpaMf: data.certificadoSpaMf ?? '',
          cnpjPromotora: data.cnpjPromotora ?? '',
          regulamentoUrl: data.regulamentoUrl ?? '',
          loteriaSerie: data.loteriaSerie ?? '',
          loteriaResultado: data.loteriaResultado ?? '',
          dataApuracao: data.dataApuracao ? new Date(data.dataApuracao).toISOString().slice(0, 16) : '',
          dataLoteria: data.dataLoteria ? new Date(data.dataLoteria).toISOString().slice(0, 10) : ''
        })
      })
      .catch(() => setError('Erro ao carregar sorteio'))
      .finally(() => setLoading(false))
  }, [id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const res = await fetch(`/api/admin/sorteios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          valorCota: parseFloat(form.valorCota),
          totalCotas: parseInt(form.totalCotas),
          premioValor: parseFloat(form.premioValor)
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao salvar')
      setSuccess(true)
      setTimeout(() => router.push('/admin/sorteios'), 1500)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-[#FFD700]" size={28} /></div>

  if (success) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <CheckCircle2 className="text-[#00FFA3]" size={48} />
      <p className="text-white font-semibold">Sorteio atualizado!</p>
    </div>
  )

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/sorteios" className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-white text-2xl font-bold">Editar Sorteio</h1>
          <p className="text-zinc-500 text-sm font-mono text-xs">{id}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="bg-[#111111] border border-zinc-800 rounded-xl p-6 space-y-4">
          <h2 className="text-white font-semibold text-sm uppercase tracking-wider border-b border-zinc-800 pb-3">Informações</h2>
          <Field label="Status">
            <select className={inputCls} value={form.status} onChange={e => set('status', e.target.value)}>
              {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field label="Título">
            <input className={inputCls} value={form.titulo} onChange={e => set('titulo', e.target.value)} />
          </Field>
          <Field label="Descrição">
            <textarea className={inputCls} rows={3} value={form.descricao} onChange={e => set('descricao', e.target.value)} />
          </Field>
          <Field label="URL da Imagem">
            <input className={inputCls} value={form.imagemUrl} onChange={e => set('imagemUrl', e.target.value)} />
          </Field>
        </section>

        <section className="bg-[#111111] border border-zinc-800 rounded-xl p-6 space-y-4">
          <h2 className="text-white font-semibold text-sm uppercase tracking-wider border-b border-zinc-800 pb-3">Valores</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Valor da Cota (R$)">
              <input className={inputCls} type="number" step="0.01" value={form.valorCota} onChange={e => set('valorCota', e.target.value)} />
            </Field>
            <Field label="Total de Cotas">
              <input className={inputCls} type="number" value={form.totalCotas} onChange={e => set('totalCotas', e.target.value)} />
            </Field>
          </div>
          <Field label="Prêmio">
            <input className={inputCls} value={form.premioDescricao} onChange={e => set('premioDescricao', e.target.value)} />
          </Field>
          <Field label="Valor do Prêmio (R$)">
            <input className={inputCls} type="number" step="0.01" value={form.premioValor} onChange={e => set('premioValor', e.target.value)} />
          </Field>
        </section>

        <section className="bg-[#111111] border border-zinc-800 rounded-xl p-6 space-y-4">
          <h2 className="text-white font-semibold text-sm uppercase tracking-wider border-b border-zinc-800 pb-3">Datas</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Data de Apuração">
              <input className={inputCls} type="datetime-local" value={form.dataApuracao} onChange={e => set('dataApuracao', e.target.value)} />
            </Field>
            <Field label="Data Loteria">
              <input className={inputCls} type="date" value={form.dataLoteria} onChange={e => set('dataLoteria', e.target.value)} />
            </Field>
          </div>
        </section>

        <section className="bg-[#111111] border border-zinc-800 rounded-xl p-6 space-y-4">
          <h2 className="text-white font-semibold text-sm uppercase tracking-wider border-b border-zinc-800 pb-3">Resultado</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Resultado Loteria">
              <input className={inputCls} value={form.loteriaResultado} onChange={e => set('loteriaResultado', e.target.value)} placeholder="Número sorteado pela Caixa" />
            </Field>
            <Field label="Série">
              <input className={inputCls} value={form.loteriaSerie} onChange={e => set('loteriaSerie', e.target.value)} placeholder="1o Premio" />
            </Field>
          </div>
        </section>

        <section className="bg-[#111111] border border-zinc-800 rounded-xl p-6 space-y-4">
          <h2 className="text-white font-semibold text-sm uppercase tracking-wider border-b border-zinc-800 pb-3">Compliance</h2>
          <Field label="Certificado SPA/MF">
            <input className={inputCls} value={form.certificadoSpaMf} onChange={e => set('certificadoSpaMf', e.target.value)} />
          </Field>
          <Field label="CNPJ Promotora">
            <input className={inputCls} value={form.cnpjPromotora} onChange={e => set('cnpjPromotora', e.target.value)} />
          </Field>
          <Field label="URL Regulamento">
            <input className={inputCls} value={form.regulamentoUrl} onChange={e => set('regulamentoUrl', e.target.value)} />
          </Field>
        </section>

        {error && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-5 py-4 text-red-400 text-sm">
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        <div className="flex gap-4 pb-8">
          <Link href="/admin/sorteios" className="flex-1 text-center py-3 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white transition-colors text-sm font-medium">
            Cancelar
          </Link>
          <button type="submit" disabled={saving}
            className="flex-1 bg-[#FFD700] hover:bg-[#FFD700]/90 disabled:opacity-50 text-black font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm">
            {saving && <Loader2 size={16} className="animate-spin" />}
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </div>
  )
}
