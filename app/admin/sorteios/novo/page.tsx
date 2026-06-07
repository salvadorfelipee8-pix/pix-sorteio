'use client'
// app/admin/sorteios/novo/page.tsx
// SorteioMax — Criar novo sorteio pelo painel admin

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'

interface FormData {
  slug: string
  titulo: string
  descricao: string
  imagemUrl: string
  valorCota: string
  totalCotas: string
  dataApuracao: string
  dataLoteria: string
  premioDescricao: string
  premioValor: string
  certificadoSpaMf: string
  cnpjPromotora: string
  regulamentoUrl: string
  dataAutorizacao: string
  loteriaSerie: string
}

const INITIAL: FormData = {
  slug: '', titulo: '', descricao: '', imagemUrl: '',
  valorCota: '', totalCotas: '', dataApuracao: '', dataLoteria: '',
  premioDescricao: '', premioValor: '', certificadoSpaMf: '',
  cnpjPromotora: '', regulamentoUrl: '', dataAutorizacao: '', loteriaSerie: ''
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-zinc-400 text-xs font-medium mb-2 uppercase tracking-wider">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputCls = "w-full bg-[#0D0D0D] border border-zinc-800 rounded-lg px-4 py-2.5 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-[#FFD700]/50 transition-colors"

export default function NovoSorteioPage() {
  const router = useRouter()
  const [form, setForm] = useState<FormData>(INITIAL)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  function set(key: keyof FormData, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  // Auto-gerar slug a partir do título
  function handleTituloChange(value: string) {
    set('titulo', value)
    if (!form.slug || form.slug === slugify(form.titulo)) {
      set('slug', slugify(value))
    }
  }

  function slugify(str: string) {
    return str.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim().replace(/\s+/g, '-')
      .slice(0, 60)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/admin/sorteios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          valorCota: parseFloat(form.valorCota),
          totalCotas: parseInt(form.totalCotas),
          premioValor: parseFloat(form.premioValor)
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao criar sorteio')

      setSuccess(true)
      setTimeout(() => router.push('/admin/sorteios'), 1500)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <CheckCircle2 className="text-[#00FFA3]" size={48} />
        <p className="text-white font-semibold">Sorteio criado com sucesso!</p>
        <p className="text-zinc-500 text-sm">Redirecionando...</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/sorteios" className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-white text-2xl font-bold">Novo Sorteio</h1>
          <p className="text-zinc-500 text-sm">Preencha todos os campos obrigatórios</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações básicas */}
        <section className="bg-[#111111] border border-zinc-800 rounded-xl p-6 space-y-4">
          <h2 className="text-white font-semibold text-sm uppercase tracking-wider border-b border-zinc-800 pb-3">
            Informações Básicas
          </h2>

          <Field label="Título" required>
            <input className={inputCls} value={form.titulo}
              onChange={e => handleTituloChange(e.target.value)}
              placeholder="Ex: iPhone 15 Pro Max" required />
          </Field>

          <Field label="Slug (URL)" required>
            <input className={inputCls} value={form.slug}
              onChange={e => set('slug', e.target.value)}
              placeholder="iphone-15-pro-max" required />
          </Field>

          <Field label="Descrição">
            <textarea className={inputCls} rows={3} value={form.descricao}
              onChange={e => set('descricao', e.target.value)}
              placeholder="Descrição do sorteio..." />
          </Field>

          <Field label="URL da Imagem">
            <input className={inputCls} value={form.imagemUrl}
              onChange={e => set('imagemUrl', e.target.value)}
              placeholder="https://..." />
          </Field>
        </section>

        {/* Cotas e valores */}
        <section className="bg-[#111111] border border-zinc-800 rounded-xl p-6 space-y-4">
          <h2 className="text-white font-semibold text-sm uppercase tracking-wider border-b border-zinc-800 pb-3">
            Cotas e Valores
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Valor da Cota (R$)" required>
              <input className={inputCls} type="number" step="0.01" min="0.01"
                value={form.valorCota} onChange={e => set('valorCota', e.target.value)}
                placeholder="25.00" required />
            </Field>
            <Field label="Total de Cotas" required>
              <input className={inputCls} type="number" min="1"
                value={form.totalCotas} onChange={e => set('totalCotas', e.target.value)}
                placeholder="1000" required />
            </Field>
          </div>
          <Field label="Descrição do Prêmio" required>
            <input className={inputCls} value={form.premioDescricao}
              onChange={e => set('premioDescricao', e.target.value)}
              placeholder="iPhone 15 Pro Max 256GB Natural Titanium" required />
          </Field>
          <Field label="Valor do Prêmio (R$)" required>
            <input className={inputCls} type="number" step="0.01" min="0"
              value={form.premioValor} onChange={e => set('premioValor', e.target.value)}
              placeholder="9999.00" required />
          </Field>
        </section>

        {/* Datas */}
        <section className="bg-[#111111] border border-zinc-800 rounded-xl p-6 space-y-4">
          <h2 className="text-white font-semibold text-sm uppercase tracking-wider border-b border-zinc-800 pb-3">
            Datas
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Data de Apuração" required>
              <input className={inputCls} type="datetime-local"
                value={form.dataApuracao} onChange={e => set('dataApuracao', e.target.value)} required />
            </Field>
            <Field label="Data do Sorteio Loteria" required>
              <input className={inputCls} type="date"
                value={form.dataLoteria} onChange={e => set('dataLoteria', e.target.value)} required />
            </Field>
          </div>
          <Field label="Data de Autorização">
            <input className={inputCls} type="date"
              value={form.dataAutorizacao} onChange={e => set('dataAutorizacao', e.target.value)} />
          </Field>
        </section>

        {/* Compliance */}
        <section className="bg-[#111111] border border-zinc-800 rounded-xl p-6 space-y-4">
          <h2 className="text-white font-semibold text-sm uppercase tracking-wider border-b border-zinc-800 pb-3">
            Compliance Legal
          </h2>
          <Field label="Certificado SPA/MF" required>
            <input className={inputCls} value={form.certificadoSpaMf}
              onChange={e => set('certificadoSpaMf', e.target.value)}
              placeholder="LTP-PRC-2024/00901" required />
          </Field>
          <Field label="CNPJ da Promotora" required>
            <input className={inputCls} value={form.cnpjPromotora}
              onChange={e => set('cnpjPromotora', e.target.value)}
              placeholder="00.000.000/0001-00" required />
          </Field>
          <Field label="URL do Regulamento">
            <input className={inputCls} value={form.regulamentoUrl}
              onChange={e => set('regulamentoUrl', e.target.value)}
              placeholder="https://..." />
          </Field>
          <Field label="Série da Loteria">
            <input className={inputCls} value={form.loteriaSerie}
              onChange={e => set('loteriaSerie', e.target.value)}
              placeholder="1o Premio" />
          </Field>
        </section>

        {error && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-5 py-4 text-red-400 text-sm">
            <AlertTriangle size={16} />
            {error}
          </div>
        )}

        <div className="flex gap-4 pb-8">
          <Link href="/admin/sorteios"
            className="flex-1 text-center py-3 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors text-sm font-medium">
            Cancelar
          </Link>
          <button type="submit" disabled={loading}
            className="flex-1 bg-[#FFD700] hover:bg-[#FFD700]/90 disabled:opacity-50 text-black font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm">
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? 'Criando...' : 'Criar Sorteio'}
          </button>
        </div>
      </form>
    </div>
  )
}
