'use client'

import { useEffect, useState } from 'react'
import { Navbar } from '@/components/ui/Navbar'
import { Footer } from '@/components/ui/Footer'
import { CountdownTimer } from '@/components/ui/CountdownTimer'
import { ModalCheckout } from '@/components/pagamento/ModalCheckout'

interface Sorteio {
  id: string
  slug: string
  titulo: string
  descricao: string
  imagemUrl: string | null
  valorCota: number
  totalCotas: number
  cotasVendidas: number
  dataApuracao: string
  premioDescricao: string
  premioValor: number
  certificadoSpaMf: string
  status: string
}

const PACOTES = [
  { quantidade: 1,   label: '1 cota',    destaque: false },
  { quantidade: 5,   label: '5 cotas',   destaque: false },
  { quantidade: 10,  label: '10 cotas',  destaque: true  },
  { quantidade: 25,  label: '25 cotas',  destaque: false },
  { quantidade: 50,  label: '50 cotas',  destaque: false },
  { quantidade: 100, label: '100 cotas', destaque: false },
]

export default function SorteioPage({ params }: { params: { slug: string } }) {
  const [sorteio, setSorteio]         = useState<Sorteio | null>(null)
  const [loading, setLoading]         = useState(true)
  const [qtd, setQtd]                 = useState(10)
  const [modalOpen, setModalOpen]     = useState(false)
  const [imgError, setImgError]       = useState(false)

  useEffect(() => {
    fetch(`/api/sorteios/${params.slug}`)
      .then(r => r.json())
      .then(d => { setSorteio(d.sorteio); setLoading(false) })
      .catch(() => setLoading(false))
  }, [params.slug])

  if (loading) return <PageSkeleton />
  if (!sorteio) return <PageNotFound />

  const percentual    = Math.round((sorteio.cotasVendidas / sorteio.totalCotas) * 100)
  const restantes     = sorteio.totalCotas - sorteio.cotasVendidas
  const valorTotal    = (sorteio.valorCota * qtd).toFixed(2)
  const esgotado      = restantes === 0 || sorteio.status === 'ESGOTADO'
  const dataApuracao  = new Date(sorteio.dataApuracao)

  return (
    <main className="min-h-screen bg-bg-primary">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-28 pb-20">

        {/* Breadcrumb */}
        <p className="text-text-muted text-sm mb-6">
          <a href="/" className="hover:text-gold-DEFAULT transition-colors">Início</a>
          <span className="mx-2">›</span>
          <span className="text-text-secondary">{sorteio.titulo}</span>
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">

          {/* ── COLUNA ESQUERDA — Imagem + Info ── */}
          <div className="animate-slide-up" style={{ animationFillMode: 'forwards' }}>

            {/* Imagem do prêmio */}
            <div className="relative rounded-2xl overflow-hidden mb-6"
              style={{ border: '1px solid rgba(255,215,0,0.12)', boxShadow: '0 20px 60px rgba(0,0,0,0.7)' }}>
              {sorteio.imagemUrl && !imgError ? (
                <img
                  src={sorteio.imagemUrl}
                  alt={sorteio.premioDescricao}
                  className="w-full h-72 object-cover"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="w-full h-72 flex items-center justify-center"
                  style={{ background: 'radial-gradient(ellipse at center, rgba(255,215,0,0.08) 0%, #141414 70%)' }}>
                  <span className="text-8xl animate-float">🏆</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-bg-surface via-transparent to-transparent" />

              {/* Badge de status */}
              <div className="absolute top-4 left-4">
                {sorteio.status === 'ATIVO' && <span className="badge badge-active">Ativo</span>}
                {sorteio.status === 'AGUARDANDO_SORTEIO' && <span className="badge badge-waiting">Aguardando Sorteio</span>}
                {sorteio.status === 'FINALIZADO' && <span className="badge badge-finished">Finalizado</span>}
              </div>

              {/* Valor do prêmio */}
              <div className="absolute bottom-4 left-4">
                <p className="text-text-muted text-xs uppercase tracking-wider">Prêmio</p>
                <p className="font-display font-black text-4xl text-gold-DEFAULT"
                  style={{ textShadow: '0 0 30px rgba(255,215,0,0.3)' }}>
                  {Number(sorteio.premioValor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>

            {/* Título e descrição */}
            <h1 className="font-display font-black text-3xl sm:text-4xl text-white mb-3">
              {sorteio.titulo}
            </h1>
            {sorteio.descricao && (
              <p className="text-text-secondary text-base leading-relaxed mb-6">{sorteio.descricao}</p>
            )}

            {/* Progress de cotas */}
            <div className="glass rounded-xl p-5 mb-6">
              <div className="flex justify-between items-center mb-3">
                <span className="text-text-secondary text-sm">Cotas vendidas</span>
                <span className="text-gold-DEFAULT font-bold text-lg">{percentual}%</span>
              </div>
              <div className="progress-wrap mb-3">
                <div className="progress-bar animate-progress" style={{ width: `${percentual}%` }} />
              </div>
              <div className="flex justify-between text-xs text-text-muted">
                <span>{sorteio.cotasVendidas.toLocaleString('pt-BR')} vendidas</span>
                <span>{restantes.toLocaleString('pt-BR')} restantes de {sorteio.totalCotas.toLocaleString('pt-BR')}</span>
              </div>
            </div>

            {/* Timer */}
            <div className="glass-gold rounded-xl p-5 mb-6">
              <CountdownTimer targetDate={dataApuracao} />
            </div>

            {/* Certificado legal */}
            <div className="glass rounded-xl p-4 flex items-start gap-3">
              <span className="text-2xl">⚖️</span>
              <div>
                <p className="text-text-secondary text-sm font-medium mb-1">Autorização SPA/MF</p>
                <p className="text-text-muted text-xs font-mono">{sorteio.certificadoSpaMf}</p>
                <p className="text-text-muted text-xs mt-1">
                  Sorteio baseado no resultado oficial da{' '}
                  <a href="https://loterias.caixa.gov.br/federal" target="_blank" rel="noopener noreferrer"
                    className="text-gold-DEFAULT hover:underline">Loteria Federal da Caixa</a>
                </p>
              </div>
            </div>
          </div>

          {/* ── COLUNA DIREITA — Seleção de cotas ── */}
          <div className="lg:sticky lg:top-28 animate-slide-up" style={{ animationDelay: '0.15s', animationFillMode: 'forwards' }}>

            <div className="glass-gold rounded-2xl p-6 sm:p-8"
              style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(255,215,0,0.05)' }}>

              <h2 className="font-display font-bold text-2xl text-white mb-2">
                Escolha suas cotas
              </h2>
              <p className="text-text-muted text-sm mb-6">
                Cada cota por apenas{' '}
                <span className="text-gold-DEFAULT font-bold">
                  {Number(sorteio.valorCota).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </p>

              {/* Pacotes */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {PACOTES.map(p => (
                  <button
                    key={p.quantidade}
                    onClick={() => setQtd(p.quantidade)}
                    disabled={esgotado}
                    className={`relative rounded-xl p-3 text-center transition-all duration-200 border ${
                      qtd === p.quantidade
                        ? 'border-gold-DEFAULT bg-gold-glow text-gold-DEFAULT'
                        : 'border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] text-text-secondary hover:border-gold-soft hover:text-white'
                    } ${esgotado ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {p.destaque && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                        style={{ background: 'linear-gradient(135deg, #FFD700, #C9A227)', color: '#0D0D0D' }}>
                        Popular
                      </span>
                    )}
                    <span className="block font-bold text-lg">{p.quantidade}</span>
                    <span className="block text-xs mt-0.5 opacity-70">cotas</span>
                  </button>
                ))}
              </div>

              {/* Input manual */}
              <div className="mb-6">
                <label className="text-text-muted text-xs uppercase tracking-wider mb-2 block">
                  Ou digite a quantidade
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQtd(q => Math.max(1, q - 1))}
                    disabled={esgotado}
                    className="w-10 h-10 rounded-lg glass flex items-center justify-center text-white text-xl hover:border-gold-soft transition-colors border border-[rgba(255,255,255,0.08)]"
                  >−</button>
                  <input
                    type="number"
                    value={qtd}
                    min={1}
                    max={Math.min(100, restantes)}
                    onChange={e => setQtd(Math.min(100, Math.max(1, Number(e.target.value))))}
                    disabled={esgotado}
                    className="input-field text-center text-xl font-bold flex-1"
                  />
                  <button
                    onClick={() => setQtd(q => Math.min(100, restantes, q + 1))}
                    disabled={esgotado}
                    className="w-10 h-10 rounded-lg glass flex items-center justify-center text-white text-xl hover:border-gold-soft transition-colors border border-[rgba(255,255,255,0.08)]"
                  >+</button>
                </div>
              </div>

              <hr className="divider-gold mb-6" />

              {/* Resumo do valor */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <p className="text-text-muted text-sm">{qtd} cota{qtd > 1 ? 's' : ''} ×{' '}
                    {Number(sorteio.valorCota).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                  <p className="text-text-secondary text-xs mt-1">Pagamento único via PIX</p>
                </div>
                <div className="text-right">
                  <p className="text-text-muted text-xs mb-1">Total</p>
                  <p className="font-display font-black text-3xl text-gold-DEFAULT">
                    {Number(valorTotal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
              </div>

              {/* CTA */}
              {!esgotado ? (
                <button
                  onClick={() => setModalOpen(true)}
                  className="btn-primary w-full text-lg py-4"
                >
                  ⚡ Garantir {qtd} cota{qtd > 1 ? 's' : ''} agora
                </button>
              ) : (
                <button disabled className="btn-secondary w-full text-lg py-4 opacity-50 cursor-not-allowed">
                  Sorteio Esgotado
                </button>
              )}

              {/* Garantias */}
              <div className="grid grid-cols-3 gap-2 mt-5">
                {[
                  { icon: '🔒', label: 'PIX seguro' },
                  { icon: '⚡', label: 'Confirmação imediata' },
                  { icon: '📧', label: 'Recebe por email' },
                ].map((g, i) => (
                  <div key={i} className="text-center">
                    <span className="text-lg block mb-1">{g.icon}</span>
                    <span className="text-text-muted text-xs">{g.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── COMO É APURADO ── */}
        <section className="mt-20">
          <h2 className="font-display font-bold text-2xl text-white mb-8 text-center">
            Como será apurado o resultado?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                n: '01', icon: '🔒',
                titulo: 'Base congelada',
                desc: 'Antes do sorteio, a lista completa de cotas e participantes é registrada com hash SHA-256 público e imutável.',
              },
              {
                n: '02', icon: '🎰',
                titulo: 'Loteria Federal sorteio',
                desc: `No dia ${dataApuracao.toLocaleDateString('pt-BR')}, o resultado oficial da Caixa Econômica Federal determina o vencedor.`,
              },
              {
                n: '03', icon: '💰',
                titulo: 'Ganhador notificado',
                desc: 'O titular da cota vencedora é contactado por email e WhatsApp. O prêmio é transferido via PIX em até 24h.',
              },
            ].map((step, i) => (
              <div key={i} className="glass rounded-xl p-6 text-center">
                <div className="glass-gold w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 animate-float"
                  style={{ animationDelay: `${i * 0.4}s` }}>
                  {step.icon}
                </div>
                <span className="text-gold-DEFAULT font-mono text-xs font-bold">{step.n}</span>
                <h3 className="font-bold text-white text-lg mt-1 mb-2">{step.titulo}</h3>
                <p className="text-text-muted text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <Footer />

      {/* Modal de checkout */}
      {modalOpen && sorteio && (
        <ModalCheckout
          sorteio={sorteio}
          quantidade={qtd}
          onClose={() => setModalOpen(false)}
        />
      )}
    </main>
  )
}

function PageSkeleton() {
  return (
    <main className="min-h-screen bg-bg-primary">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 pt-28 pb-20 grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-4">
          <div className="skeleton h-72 w-full rounded-2xl" />
          <div className="skeleton h-10 w-3/4 rounded-lg" />
          <div className="skeleton h-4 w-full rounded" />
          <div className="skeleton h-24 rounded-xl" />
        </div>
        <div className="skeleton h-96 rounded-2xl" />
      </div>
    </main>
  )
}

function PageNotFound() {
  return (
    <main className="min-h-screen bg-bg-primary flex items-center justify-center">
      <Navbar />
      <div className="text-center">
        <p className="text-6xl mb-4">🔍</p>
        <h1 className="font-display font-bold text-2xl text-white mb-2">Sorteio não encontrado</h1>
        <p className="text-text-muted mb-6">Este sorteio não existe ou foi removido.</p>
        <a href="/" className="btn-primary">Ver todos os sorteios</a>
      </div>
    </main>
  )
}

