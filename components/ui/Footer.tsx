import Link from 'next/link'

export function Footer() {
  const ano = new Date().getFullYear()

  return (
    <footer className="border-t border-[rgba(255,255,255,0.06)] mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">

        {/* Grid principal */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">

          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gold-gradient flex items-center justify-center">
                <span className="text-black font-bold text-sm font-display">S</span>
              </div>
              <span className="font-display font-bold text-xl text-white">
                Sorteio<span className="text-gold-DEFAULT">Max</span>
              </span>
            </div>
            <p className="text-text-muted text-sm leading-relaxed">
              A plataforma de sorteios PIX mais transparente do Brasil.
              Operamos dentro da lei, com total segurança para você.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Sorteios</h4>
            <ul className="space-y-3">
              {[
                ['Ativos', '/#sorteios'],
                ['Finalizados', '/sorteios/finalizados'],
                ['Ganhadores', '/#ganhadores'],
                ['Como Funciona', '/#como-funciona'],
              ].map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="text-text-muted hover:text-gold-DEFAULT transition-colors text-sm">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Conta</h4>
            <ul className="space-y-3">
              {[
                ['Minha Conta', '/minha-conta'],
                ['Minhas Cotas', '/minha-conta/cotas'],
                ['Cadastrar', '/auth/cadastro'],
                ['Entrar', '/auth/login'],
              ].map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="text-text-muted hover:text-gold-DEFAULT transition-colors text-sm">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Legal</h4>
            <ul className="space-y-3">
              {[
                ['Política de Privacidade', '/privacidade'],
                ['Termos de Uso', '/termos'],
                ['Regulamentos', '/regulamentos'],
                ['Transparência', '/#legal'],
                ['Fale Conosco', '/contato'],
              ].map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="text-text-muted hover:text-gold-DEFAULT transition-colors text-sm">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <hr className="divider-gold mb-8" />

        {/* Avisos legais */}
        <div className="glass rounded-xl p-5 mb-8">
          <p className="text-text-muted text-xs leading-relaxed text-center">
            ⚖️ <strong className="text-text-secondary">Aviso Legal:</strong> Os sorteios realizados
            nesta plataforma são modalidades de Promoção Comercial reguladas pela{' '}
            <strong className="text-text-secondary">Lei 5.768/71</strong> e pelo{' '}
            <strong className="text-text-secondary">Decreto 70.951/72</strong>, com autorização da
            Secretaria de Prêmios e Apostas do Ministério da Fazenda (SPA/MF).
            A apuração é vinculada à <strong className="text-text-secondary">Loteria Federal da Caixa</strong>.
            Proibida a participação de menores de 18 anos.
            O jogo pode causar dependência. Jogue com responsabilidade.
          </p>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-text-muted text-xs">
            © {ano} SorteioMax. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-3">
            <span className="text-text-muted text-xs">Pagamentos seguros via</span>
            <span className="glass-gold rounded-md px-3 py-1 text-gold-DEFAULT text-xs font-bold">
              PIX
            </span>
            <span className="text-text-muted text-xs">·</span>
            <span className="text-text-muted text-xs">🔒 SSL/TLS · LGPD</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
