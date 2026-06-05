import { Navbar }      from '@/components/ui/Navbar'
import { HeroSection } from '@/components/ui/HeroSection'
import { Footer }      from '@/components/ui/Footer'
import { SorteioCard } from '@/components/sorteio/SorteioCard'
import { prisma }      from '@/lib/prisma'

// Busca sorteios ativos do banco (Server Component)
async function getSorteiosAtivos() {
  try {
    return await prisma.sorteio.findMany({
      where: { status: 'ATIVO' },
      orderBy: { dataApuracao: 'asc' },
    })
  } catch {
    return []
  }
}

export default async function HomePage() {
  const sorteios = await getSorteiosAtivos()

  return (
    <main className="min-h-screen bg-bg-primary">
      <Navbar />

      {/* ── HERO ── */}
      <HeroSection />

      {/* ── SORTEIOS ATIVOS ── */}
      <section id="sorteios" className="max-w-7xl mx-auto px-4 sm:px-6 py-24">
        <div className="text-center mb-14">
          <span className="badge badge-active mb-4">Ao vivo agora</span>
          <h2 className="font-display font-bold text-title text-white mb-4">
            Sorteios em Andamento
          </h2>
          <p className="text-text-secondary text-lg max-w-xl mx-auto">
            Escolha seu favorito, selecione suas cotas e aguarde o sorteio da Loteria Federal.
          </p>
        </div>

        {sorteios.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sorteios.map((s, i) => (
              <div
                key={s.id}
                className="animate-slide-up"
                style={{ animationDelay: `${i * 0.1}s`, opacity: 0, animationFillMode: 'forwards' }}
              >
                <SorteioCard
                  slug={s.slug}
                  titulo={s.titulo}
                  premioDescricao={s.premioDescricao}
                  premioValor={Number(s.premioValor)}
                  valorCota={Number(s.valorCota)}
                  totalCotas={s.totalCotas}
                  cotasVendidas={s.cotasVendidas}
                  dataApuracao={s.dataApuracao}
                  imagemUrl={s.imagemUrl ?? undefined}
                  status={s.status as any}
                />
              </div>
            ))}
          </div>
        ) : (
          /* Estado vazio elegante */
          <div className="text-center py-20 glass rounded-2xl">
            <p className="text-6xl mb-6">🏆</p>
            <p className="font-display font-bold text-2xl text-white mb-3">
              Novos sorteios em breve
            </p>
            <p className="text-text-muted">Cadastre-se para ser notificado quando abrir.</p>
          </div>
        )}
      </section>

      {/* ── COMO FUNCIONA ── */}
      <section id="como-funciona" className="py-24"
        style={{ background: 'radial-gradient(ellipse 100% 60% at 50% 50%, rgba(255,215,0,0.03) 0%, transparent 70%)' }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="font-display font-bold text-title text-white mb-4">
              Como Funciona?
            </h2>
            <p className="text-text-secondary text-lg">Simples, transparente e 100% legal.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
            {[
              { n: '01', icon: '👤', titulo: 'Cadastre-se', desc: 'Crie sua conta gratuitamente com CPF e email.' },
              { n: '02', icon: '🎟️', titulo: 'Escolha cotas', desc: 'Selecione quantas cotas quiser. Quanto mais, maior a chance.' },
              { n: '03', icon: '⚡', titulo: 'Pague via PIX', desc: 'QR Code gerado na hora. Pagamento confirmado em segundos.' },
              { n: '04', icon: '🎰', titulo: 'Aguarde o sorteio', desc: 'Apuração pela Loteria Federal da Caixa. Resultado público.' },
              { n: '05', icon: '💰', titulo: 'Receba o prêmio', desc: 'Ganhador contactado e prêmio transferido via PIX.' },
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <div className="glass-gold w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4 animate-float"
                  style={{ animationDelay: `${i * 0.3}s` }}>
                  {step.icon}
                </div>
                <span className="text-gold-DEFAULT font-mono text-xs font-bold mb-1">{step.n}</span>
                <h3 className="font-bold text-white mb-2">{step.titulo}</h3>
                <p className="text-text-muted text-sm leading-relaxed">{step.desc}</p>

                {i < 4 && (
                  <div className="hidden md:block absolute" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRANSPARÊNCIA / LEGAL ── */}
      <section id="legal" className="max-w-4xl mx-auto px-4 sm:px-6 py-24">
        <div className="glass-gold rounded-2xl p-8 sm:p-12 text-center">
          <span className="text-4xl mb-6 block">⚖️</span>
          <h2 className="font-display font-bold text-3xl text-white mb-4">
            Total Transparência & Segurança Jurídica
          </h2>
          <p className="text-text-secondary text-lg mb-8 leading-relaxed">
            Todos os nossos sorteios operam com Certificado de Autorização da{' '}
            <strong className="text-gold-DEFAULT">Secretaria de Prêmios e Apostas (SPA/MF)</strong>,
            vinculados aos resultados oficiais da{' '}
            <strong className="text-gold-DEFAULT">Loteria Federal da Caixa</strong>.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[
              { icon: '🔒', label: 'Dados criptografados\n(AES-256 + LGPD)' },
              { icon: '📋', label: 'Regulamento publicado\npor sorteio' },
              { icon: '🔗', label: 'Hash SHA-256 da base\nantes do sorteio' },
            ].map((item, i) => (
              <div key={i} className="glass rounded-xl p-4">
                <span className="text-2xl block mb-2">{item.icon}</span>
                <p className="text-text-secondary text-sm whitespace-pre-line">{item.label}</p>
              </div>
            ))}
          </div>

          <a
            href="https://loterias.caixa.gov.br/federal"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary inline-flex"
          >
            Verificar resultado oficial da Caixa →
          </a>
        </div>
      </section>

      <Footer />
    </main>
  )
}
