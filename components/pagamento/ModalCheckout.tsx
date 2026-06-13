'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface Sorteio {
  id: string
  titulo: string
  valorCota: number
  premioValor: number
}

interface Props {
  sorteio: Sorteio
  quantidade: number
  onClose: () => void
}

type Step = 'dados' | 'pix' | 'confirmado'

interface FormData {
  nome: string
  email: string
  cpf: string
  telefone: string
}

interface PagamentoData {
  pagamentoId: string
  qrCodePayload: string
  qrCodeImageUrl: string
  valor: number
  expiresAt: string
}

export function ModalCheckout({ sorteio, quantidade, onClose }: Props) {
  const { data: session, status: sessionStatus } = useSession()
  const isLogado = sessionStatus === 'authenticated' && !!session?.user

  const [step, setStep]           = useState<Step>('dados')
  const [form, setForm]           = useState<FormData>({ nome: '', email: '', cpf: '', telefone: '' })
  const [errors, setErrors]       = useState<Partial<FormData & { geral: string }>>({})
  const [loading, setLoading]     = useState(false)
  const [pagamento, setPagamento] = useState<PagamentoData | null>(null)
  const [copiado, setCopiado]     = useState(false)
  const [tempo, setTempo]         = useState(900)
  const [numerosCotas, setNumerosCotas] = useState<number[]>([])

  const valorTotal = (Number(sorteio.valorCota) * quantidade).toFixed(2)

  // Pré-preenche o formulário com dados da sessão
  useEffect(() => {
    if (isLogado && session?.user) {
      setForm(f => ({
        ...f,
        nome:  session.user?.name  ?? f.nome,
        email: session.user?.email ?? f.email,
      }))
    }
  }, [isLogado, session])

  // Timer de expiração do PIX
  useEffect(() => {
    if (step !== 'pix') return
    const interval = setInterval(() => {
      setTempo(t => {
        if (t <= 1) { clearInterval(interval); onClose(); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [step, onClose])

  // Polling de confirmação do pagamento
  useEffect(() => {
    if (step !== 'pix' || !pagamento) return
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/pagamentos/${pagamento.pagamentoId}/status`)
        const data = await res.json()
        if (data.status === 'PAGO') {
          setNumerosCotas(data.numerosCotas ?? [])
          setStep('confirmado')
          clearInterval(interval)
        }
      } catch {}
    }, 3000)
    return () => clearInterval(interval)
  }, [step, pagamento])

  const formatarTempo = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0')
    const seg = (s % 60).toString().padStart(2, '0')
    return `${m}:${seg}`
  }

  const formatarCPF = (v: string) =>
    v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2').slice(0, 14)

  const validarForm = () => {
    const e: Partial<FormData & { geral: string }> = {}
    if (!form.nome.trim() || form.nome.trim().split(' ').length < 2) e.nome = 'Nome completo obrigatório'
    if (!form.email.includes('@')) e.email = 'Email inválido'
    const cpfLimpo = form.cpf.replace(/\D/g, '')
    if (cpfLimpo.length !== 11) e.cpf = 'CPF inválido'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    // Para usuários logados, não precisa validar o formulário — o backend usa os dados da sessão
    if (!isLogado && !validarForm()) return

    setLoading(true)
    setErrors({})
    try {
      const body = isLogado
        ? { sorteioId: sorteio.id, quantidade, nome: form.nome, email: form.email, cpf: '' }
        : {
            sorteioId: sorteio.id,
            quantidade,
            nome: form.nome,
            email: form.email,
            cpf: form.cpf.replace(/\D/g, ''),
            telefone: form.telefone,
          }

      const res = await fetch('/api/pagamentos/criar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPagamento(data)
      setStep('pix')
    } catch (err: any) {
      setErrors({ geral: err.message ?? 'Erro ao gerar cobrança. Tente novamente.' })
    } finally {
      setLoading(false)
    }
  }

  const copiarPix = () => {
    if (!pagamento) return
    navigator.clipboard.writeText(pagamento.qrCodePayload)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 3000)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md glass-gold rounded-2xl overflow-hidden animate-slide-up"
        style={{ boxShadow: '0 30px 80px rgba(0,0,0,0.8), 0 0 40px rgba(255,215,0,0.08)', animationFillMode: 'forwards' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[rgba(255,215,0,0.1)]">
          <div>
            <h3 className="font-display font-bold text-white text-lg">
              {step === 'dados' && 'Confirmar compra'}
              {step === 'pix' && 'Pague via PIX'}
              {step === 'confirmado' && 'Pagamento confirmado!'}
            </h3>
            <p className="text-text-muted text-xs mt-0.5">
              {step !== 'confirmado' && `${quantidade} cota${quantidade > 1 ? 's' : ''} · R$ ${valorTotal}`}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg glass flex items-center justify-center text-text-muted hover:text-white transition-colors text-lg">×</button>
        </div>

        {/* Steps indicator */}
        {step !== 'confirmado' && (
          <div className="flex px-5 py-3 gap-2">
            {(['dados', 'pix'] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === s ? 'bg-gold-gradient text-black' :
                  (step === 'pix' && s === 'dados') ? 'bg-mint-DEFAULT text-black' :
                  'bg-[rgba(255,255,255,0.08)] text-text-muted'
                }`}>
                  {step === 'pix' && s === 'dados' ? '✓' : i + 1}
                </div>
                <span className={`text-xs ${step === s ? 'text-gold-DEFAULT' : 'text-text-muted'}`}>
                  {s === 'dados' ? 'Dados' : 'PIX'}
                </span>
                {i === 0 && <div className="flex-1 h-px bg-[rgba(255,255,255,0.08)]" />}
              </div>
            ))}
          </div>
        )}

        <div className="p-5">

          {/* ── STEP 1: DADOS ── */}
          {step === 'dados' && (
            <div className="space-y-4">

              {/* Usuário logado — mostra resumo da conta */}
              {isLogado ? (
                <div className="glass rounded-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gold-glow flex items-center justify-center text-lg font-bold text-gold-DEFAULT shrink-0">
                    {(session?.user?.name ?? '?')[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{session?.user?.name}</p>
                    <p className="text-text-muted text-xs truncate">{session?.user?.email}</p>
                  </div>
                  <span className="ml-auto text-xs bg-mint-glow text-mint-DEFAULT border border-[rgba(0,255,163,0.2)] px-2 py-0.5 rounded-full shrink-0">Logado</span>
                </div>
              ) : (
                /* Guest — formulário completo */
                <>
                  <div>
                    <label className="text-text-muted text-xs uppercase tracking-wider mb-1.5 block">Nome completo</label>
                    <input className={`input-field ${errors.nome ? 'border-danger' : ''}`}
                      placeholder="João da Silva" value={form.nome}
                      onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
                    {errors.nome && <p className="text-danger text-xs mt-1">{errors.nome}</p>}
                  </div>

                  <div>
                    <label className="text-text-muted text-xs uppercase tracking-wider mb-1.5 block">Email</label>
                    <input className={`input-field ${errors.email ? 'border-danger' : ''}`}
                      type="email" placeholder="joao@email.com" value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                    {errors.email && <p className="text-danger text-xs mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="text-text-muted text-xs uppercase tracking-wider mb-1.5 block">CPF</label>
                    <input className={`input-field ${errors.cpf ? 'border-danger' : ''}`}
                      placeholder="000.000.000-00" value={form.cpf}
                      onChange={e => setForm(f => ({ ...f, cpf: formatarCPF(e.target.value) }))} />
                    {errors.cpf && <p className="text-danger text-xs mt-1">{errors.cpf}</p>}
                  </div>

                  <div>
                    <label className="text-text-muted text-xs uppercase tracking-wider mb-1.5 block">WhatsApp (opcional)</label>
                    <input className="input-field"
                      placeholder="(11) 99999-9999" value={form.telefone}
                      onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} />
                  </div>
                </>
              )}

              {/* Resumo do pedido */}
              <div className="glass rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-text-muted text-xs">{sorteio.titulo}</p>
                    <p className="text-white text-sm font-medium mt-0.5">{quantidade} cota{quantidade > 1 ? 's' : ''}</p>
                  </div>
                  <p className="font-display font-bold text-xl text-gold-DEFAULT">
                    R$ {valorTotal}
                  </p>
                </div>
              </div>

              {errors.geral && (
                <div className="bg-[rgba(255,77,77,0.1)] border border-[rgba(255,77,77,0.25)] rounded-xl p-3">
                  <p className="text-danger text-sm">{errors.geral}</p>
                </div>
              )}

              {!isLogado && (
                <p className="text-text-muted text-xs flex items-center gap-1.5">
                  <span>🔒</span>
                  Seus dados são protegidos pela LGPD e nunca serão compartilhados.
                </p>
              )}

              <button onClick={handleSubmit} disabled={loading || sessionStatus === 'loading'} className="btn-primary w-full py-4 text-base">
                {loading ? 'Gerando cobrança...' : `Gerar PIX · R$ ${valorTotal}`}
              </button>

              {!isLogado && (
                <p className="text-center text-text-muted text-xs">
                  Já tem conta?{' '}
                  <a href="/entrar" className="text-gold-DEFAULT hover:underline">Entrar</a>
                  {' '}para comprar mais rápido
                </p>
              )}
            </div>
          )}

          {/* ── STEP 2: PIX ── */}
          {step === 'pix' && pagamento && (
            <div className="text-center">
              <div className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-4 ${
                tempo < 120 ? 'bg-[rgba(255,77,77,0.1)] text-danger border border-[rgba(255,77,77,0.2)]' :
                'bg-mint-glow text-mint-DEFAULT border border-[rgba(0,255,163,0.2)]'
              } text-sm font-mono font-bold`}>
                {formatarTempo(tempo)}
              </div>

              <p className="text-text-secondary text-sm mb-4">
                Escaneie o QR Code ou copie o código PIX
              </p>

              <div className="qrcode-wrap mx-auto mb-4 w-fit">
                {pagamento.qrCodeImageUrl ? (
                  <img
                    src={pagamento.qrCodeImageUrl.startsWith('data:')
                      ? pagamento.qrCodeImageUrl
                      : `data:image/png;base64,${pagamento.qrCodeImageUrl}`}
                    alt="QR Code PIX"
                    className="w-48 h-48"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center bg-gray-100 rounded">
                    <span className="text-gray-400 text-sm">QR Code</span>
                  </div>
                )}
              </div>

              <button onClick={copiarPix} className={`w-full py-3 rounded-xl font-bold text-sm transition-all mb-4 ${
                copiado
                  ? 'bg-mint-glow border border-[rgba(0,255,163,0.3)] text-mint-DEFAULT'
                  : 'btn-primary'
              }`}>
                {copiado ? '✓ Código copiado!' : 'Copiar código PIX'}
              </button>

              <div className="glass rounded-xl p-3 text-left">
                <p className="text-text-muted text-xs font-mono break-all select-all">
                  {pagamento.qrCodePayload}
                </p>
              </div>

              <p className="text-text-muted text-xs mt-4 flex items-center justify-center gap-1">
                <span className="w-2 h-2 rounded-full bg-mint-DEFAULT animate-glow-pulse inline-block" />
                Aguardando confirmação do pagamento...
              </p>
            </div>
          )}

          {/* ── STEP 3: CONFIRMADO ── */}
          {step === 'confirmado' && (
            <div className="text-center py-4">
              <div className="text-7xl mb-4 animate-float">🎉</div>
              <h3 className="font-display font-bold text-2xl text-white mb-2">
                Cotas garantidas!
              </h3>
              <p className="text-text-secondary mb-6">
                Você receberá os detalhes no email{' '}
                <strong className="text-white">{session?.user?.email ?? form.email}</strong>
              </p>

              {numerosCotas.length > 0 && (
                <div className="glass rounded-xl p-4 mb-6">
                  <p className="text-text-muted text-xs uppercase tracking-wider mb-3">Seus números da sorte</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {numerosCotas.map(n => (
                      <span key={n} className="cota-number glass-gold rounded-lg px-3 py-1.5 text-base">
                        #{String(n).padStart(4, '0')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="glass rounded-xl p-4 mb-6 text-left">
                <p className="text-text-muted text-xs mb-1">Sorteio</p>
                <p className="text-white font-medium text-sm">{sorteio.titulo}</p>
                <p className="text-text-muted text-xs mt-2 mb-1">Prêmio</p>
                <p className="text-gold-DEFAULT font-bold">
                  {Number(sorteio.premioValor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                </p>
              </div>

              {!isLogado && (
                <div className="glass rounded-xl p-4 mb-4 text-left border border-[rgba(255,215,0,0.15)]">
                  <p className="text-gold-DEFAULT text-xs font-semibold mb-1">Conta criada automaticamente</p>
                  <p className="text-text-muted text-xs">
                    Criamos uma conta para {form.email}. Você receberá um email para definir sua senha e acompanhar seus sorteios.
                  </p>
                </div>
              )}

              <button onClick={onClose} className="btn-primary w-full py-3">
                Fechar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
