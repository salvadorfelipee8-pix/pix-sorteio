'use client'
// app/auth/cadastro/page.tsx
// SorteioMax — Cadastro de participante com validação CPF + LGPD

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react'

interface FormData {
  nome: string
  email: string
  cpf: string
  telefone: string
  dataNascimento: string
  senha: string
  confirmarSenha: string
  lgpdAceito: boolean
}

const INITIAL: FormData = {
  nome: '', email: '', cpf: '', telefone: '',
  dataNascimento: '', senha: '', confirmarSenha: '', lgpdAceito: false
}

function formatarCPF(v: string) {
  return v.replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    .slice(0, 14)
}

function formatarTelefone(v: string) {
  return v.replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .slice(0, 15)
}

export default function CadastroPage() {
  const router = useRouter()
  const [form, setForm] = useState<FormData>(INITIAL)
  const [showSenha, setShowSenha] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  function set(key: keyof FormData, value: string | boolean) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (form.senha !== form.confirmarSenha) {
      setError('As senhas não coincidem.')
      return
    }
    if (form.senha.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.')
      return
    }
    if (!form.lgpdAceito) {
      setError('Você precisa aceitar os termos para continuar.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/cadastro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: form.nome,
          email: form.email,
          cpf: form.cpf.replace(/\D/g, ''),
          telefone: form.telefone,
          dataNascimento: form.dataNascimento,
          senha: form.senha,
          lgpdAceito: form.lgpdAceito
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      // Login automático após cadastro
      await signIn('credentials', {
        email: form.email,
        password: form.senha,
        redirect: false
      })

      setSuccess(true)
      setTimeout(() => router.push('/minha-conta'), 1500)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center">
          <CheckCircle2 className="text-[#00FFA3] mx-auto mb-4" size={56} />
          <p className="text-white text-2xl font-bold">Cadastro realizado!</p>
          <p className="text-text-muted mt-2">Redirecionando para sua conta...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4 py-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#FFD700]/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gold-gradient flex items-center justify-center shadow-gold-sm">
              <span className="text-black font-bold text-base font-display">S</span>
            </div>
            <span className="font-display font-bold text-2xl text-white">
              Sorteio<span className="text-gold-DEFAULT">Max</span>
            </span>
          </Link>
        </div>

        <div className="glass-gold rounded-2xl p-8" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
          <h1 className="text-white text-2xl font-bold mb-1">Criar conta</h1>
          <p className="text-text-muted text-sm mb-6">Grátis e sem mensalidade</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-text-muted text-xs uppercase tracking-wider mb-1.5 block">Nome completo</label>
              <input className="input-field" value={form.nome} onChange={e => set('nome', e.target.value)}
                placeholder="João da Silva" required />
            </div>

            <div>
              <label className="text-text-muted text-xs uppercase tracking-wider mb-1.5 block">Email</label>
              <input className="input-field" type="email" value={form.email} onChange={e => set('email', e.target.value)}
                placeholder="seu@email.com" required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-text-muted text-xs uppercase tracking-wider mb-1.5 block">CPF</label>
                <input className="input-field" value={form.cpf}
                  onChange={e => set('cpf', formatarCPF(e.target.value))}
                  placeholder="000.000.000-00" required />
              </div>
              <div>
                <label className="text-text-muted text-xs uppercase tracking-wider mb-1.5 block">WhatsApp</label>
                <input className="input-field" value={form.telefone}
                  onChange={e => set('telefone', formatarTelefone(e.target.value))}
                  placeholder="(11) 99999-9999" />
              </div>
            </div>

            <div>
              <label className="text-text-muted text-xs uppercase tracking-wider mb-1.5 block">Data de Nascimento</label>
              <input className="input-field" type="date" value={form.dataNascimento}
                onChange={e => set('dataNascimento', e.target.value)} required />
            </div>

            <div>
              <label className="text-text-muted text-xs uppercase tracking-wider mb-1.5 block">Senha</label>
              <div className="relative">
                <input className="input-field pr-12" type={showSenha ? 'text' : 'password'}
                  value={form.senha} onChange={e => set('senha', e.target.value)}
                  placeholder="Mínimo 8 caracteres" required minLength={8} />
                <button type="button" onClick={() => setShowSenha(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-white transition-colors">
                  {showSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-text-muted text-xs uppercase tracking-wider mb-1.5 block">Confirmar Senha</label>
              <input className="input-field" type="password" value={form.confirmarSenha}
                onChange={e => set('confirmarSenha', e.target.value)}
                placeholder="••••••••" required />
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={form.lgpdAceito}
                onChange={e => set('lgpdAceito', e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-yellow-400" />
              <span className="text-text-muted text-xs leading-relaxed">
                Concordo com os{' '}
                <Link href="/termos" className="text-gold-DEFAULT hover:underline">Termos de Uso</Link>
                {' '}e{' '}
                <Link href="/privacidade" className="text-gold-DEFAULT hover:underline">Política de Privacidade</Link>
                . Autorizo o tratamento dos meus dados conforme a LGPD.
              </span>
            </label>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="btn-primary w-full py-3.5 flex items-center justify-center gap-2">
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Criando conta...' : 'Criar conta grátis'}
            </button>
          </form>

          <p className="text-center text-text-muted text-sm mt-6">
            Já tem conta?{' '}
            <Link href="/auth/login" className="text-gold-DEFAULT hover:underline font-medium">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
