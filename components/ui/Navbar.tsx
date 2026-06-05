'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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
          <Link href="/auth/login" className="btn-secondary py-2 px-5 text-sm">
            Entrar
          </Link>
          <Link href="/#sorteios" className="btn-primary py-2 px-5 text-sm">
            Participar
          </Link>
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
          {['/#sorteios', '/#como-funciona', '/#ganhadores', '/#legal'].map((href, i) => (
            <Link
              key={i}
              href={href}
              onClick={() => setMenuOpen(false)}
              className="text-text-secondary text-base py-2"
            >
              {['Sorteios', 'Como Funciona', 'Ganhadores', 'Transparência'][i]}
            </Link>
          ))}
          <hr className="divider-gold" />
          <Link href="/auth/login" className="btn-secondary text-center">Entrar</Link>
          <Link href="/#sorteios" className="btn-primary text-center">Participar Agora</Link>
        </div>
      )}
    </header>
  )
}
