'use client'
// app/auth/login/page.tsx
// CORRIGIDO: useSearchParams dentro de Suspense boundary

import { Suspense, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/minha-conta'

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [showSenha, setShowSenha] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const result = await signIn('credentials', { email, password: senha, redirect: false })
    if (result?.error) {
      setError('Email ou senha incorretos.')
      setLoading(false)
      return
    }
    router.push(callbackUrl)
    router.refresh()
  }

  return (
    <div className="glass-gold rounded-2xl p-8" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
      <h1 className="text-white text-2xl font-bold mb-1">Entrar</h1>
      <p className="text-text-muted text-sm mb-6">Acesse sua conta para gerenciar suas cotas</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-text-muted text-xs uppercase tracking-wider mb-1.5 block">Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            required autoComplete="email" placeholder="seu@email.com" className="input-field" />
        </div>
        <div>
          <label className="text-text-muted text-xs uppercase tracking-wider mb-1.5 block">Senha</label>
          <div className="relative">
            <input type={showSenha ? 'text' : 'password'} value={senha}
              onChange={e => setSenha(e.target.value)} required autoComplete="current-password"
              placeholder="••••••••" className="input-field pr-12" />
            <button type="button" onClick={() => setShowSenha(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-white transition-colors">
              {showSenha ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">{error}</div>
        )}
        <button type="submit" disabled={loading}
          className="btn-primary w-full py-3.5 flex items-center justify-center gap-2">
          {loading && <Loader2 size={16} className="animate-spin" />}
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <div className="mt-6 text-center space-y-2">
        <p className="text-text-muted text-sm">
          Não tem conta?{' '}
          <Link href="/auth/cadastro" className="text-gold-DEFAULT hover:underline font-medium">Cadastre-se grátis</Link>
        </p>
        <Link href="/" className="text-text-muted text-xs hover:text-white transition-colors block">← Voltar ao início</Link>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FFD700]/5 rounded-full blur-[120px]" />
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
        <Suspense fallback={
          <div className="glass-gold rounded-2xl p-8 flex items-center justify-center h-64">
            <Loader2 className="animate-spin text-gold-DEFAULT" size={28} />
          </div>
        }>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
