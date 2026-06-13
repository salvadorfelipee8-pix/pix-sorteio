'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { User, LogOut, Ticket, ChevronDown } from 'lucide-react'

export function Navbar() {
  const { data: session, status } = useSession()
  const isLogado = status === 'authenticated' && !!session?.user

  const [scrolled, setScrolled]   = useState(false)
  const [menuOpen, setMenuOpen]   = useState(false)
  const [userMenu, setUserMenu]   = useState(false)
  const userMenuRef               = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const inicialNome = session?.user?.name?.[0]?.toUpperCase() ?? '?'

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'glass border-b border-[rgba(255,215,0,0.08)] py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gold-gradient flex items-center justify-center shadow-gold-sm">
            <span className="text-black font-bold text-sm font-display">S</span>
          </div>
          <span className="font-display font-bold text-xl text-white">
            Sorteio<span className="text-gold-DEFAULT">Max</span>
          </span>
        </Link>

        {/* Nav desktop */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/#sorteios" className="text-text-secondary hover:text-white transition-colors text-sm font-medium">
            Sorteios
          </Link>
          <Link href="/#como-funciona" className="text-text-secondary hover:text-white transition-colors text-sm font-medium">
            Como Funciona
          </Link>
          <Link href="/#ganhadores" className="text-text-secondary hover:text-white transition-colors text-sm font-medium">
            Ganhadores
          </Link>
          <Link href="/#legal" className="text-text-secondary hover:text-white transition-colors text-sm font-medium">
            Transparência
          </Link>
        </nav>

        {/* Actions desktop */}
        <div className="hidden md:flex items-center gap-3">
          {status === 'loading' ? (
            <div className="w-8 h-8 rounded-full bg-[rgba(255,255,255,0.06)] animate-pulse" />
          ) : isLogado ? (
            /* ── Usuário logado ── */
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenu(v => !v)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl glass hover:border-[rgba(255,215,0,0.2)] transition-all border border-transparent"
              >
                <div className="w-7 h-7 rounded-full bg-gold-gradient flex items-center justify-center text-black font-bold text-xs shrink-0">
                  {inicialNome}
                </div>
                <span className="text-white text-sm max-w-[120px] truncate">{session?.user?.name}</span>
                <ChevronDown size={14} className={`text-text-muted transition-transform ${userMenu ? 'rotate-180' : ''}`} />
              </button>

              {userMenu && (
                <div className="absolute right-0 top-full mt-2 w-52 glass-gold rounded-xl border border-[rgba(255,215,0,0.12)] shadow-xl overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-[rgba(255,255,255,0.06)]">
                    <p className="text-white text-sm font-semibold truncate">{session?.user?.name}</p>
                    <p className="text-text-muted text-xs truncate">{session?.user?.email}</p>
                  </div>
                  <div className="py-1">
                    <Link
                      href="/minha-conta"
                      onClick={() => setUserMenu(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-text-secondary hover:text-white hover:bg-[rgba(255,255,255,0.04)] transition-colors text-sm"
                    >
                      <Ticket size={15} />
                      Minhas Cotas
                    </Link>
                    <button
                      onClick={() => { setUserMenu(false); signOut({ callbackUrl: '/' }) }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-text-secondary hover:text-danger hover:bg-[rgba(255,77,77,0.05)] transition-colors text-sm"
                    >
                      <LogOut size={15} />
                      Sair
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ── Guest ── */
            <>
              <Link href="/auth/login" className="btn-secondary py-2 px-5 text-sm">
                Entrar
              </Link>
              <Link href="/#sorteios" className="btn-primary py-2 px-5 text-sm">
                Participar
              </Link>
            </>
          )}
        </div>

        {/* Hamburger mobile */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden w-9 h-9 flex flex-col justify-center items-center gap-1.5"
          aria-label="Menu"
        >
          <span className={`w-5 h-0.5 bg-white transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`w-5 h-0.5 bg-white transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
          <span className={`w-5 h-0.5 bg-white transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </div>

      {/* Menu mobile */}
      {menuOpen && (
        <div className="md:hidden glass border-t border-[rgba(255,215,0,0.08)] px-4 py-4 flex flex-col gap-4">
          {[
            { href: '/#sorteios', label: 'Sorteios' },
            { href: '/#como-funciona', label: 'Como Funciona' },
            { href: '/#ganhadores', label: 'Ganhadores' },
            { href: '/#legal', label: 'Transparência' },
          ].map(({ href, label }) => (
            <Link key={href} href={href} onClick={() => setMenuOpen(false)} className="text-text-secondary text-base py-2">
              {label}
            </Link>
          ))}
          <hr className="divider-gold" />
          {isLogado ? (
            <>
              <div className="flex items-center gap-3 py-2">
                <div className="w-8 h-8 rounded-full bg-gold-gradient flex items-center justify-center text-black font-bold text-sm shrink-0">
                  {inicialNome}
                </div>
                <div className="min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{session?.user?.name}</p>
                  <p className="text-text-muted text-xs truncate">{session?.user?.email}</p>
                </div>
              </div>
              <Link href="/minha-conta" onClick={() => setMenuOpen(false)} className="btn-secondary text-center flex items-center justify-center gap-2">
                <Ticket size={15} /> Minhas Cotas
              </Link>
              <button onClick={() => signOut({ callbackUrl: '/' })} className="w-full text-center py-3 rounded-xl border border-[rgba(255,77,77,0.3)] text-danger text-sm font-medium hover:bg-[rgba(255,77,77,0.05)] transition-colors flex items-center justify-center gap-2">
                <LogOut size={15} /> Sair
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="btn-secondary text-center">Entrar</Link>
              <Link href="/#sorteios" className="btn-primary text-center">Participar Agora</Link>
            </>
          )}
        </div>
      )}
    </header>
  )
}
