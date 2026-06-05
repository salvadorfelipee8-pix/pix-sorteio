'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'

export function HeroSection() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Partículas douradas no fundo
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width  = window.innerWidth
    canvas.height = window.innerHeight

    const particles: Array<{
      x: number; y: number; r: number
      vx: number; vy: number; alpha: number; va: number
    }> = []

    for (let i = 0; i < 60; i++) {
      particles.push({
        x:     Math.random() * canvas.width,
        y:     Math.random() * canvas.height,
        r:     Math.random() * 1.5 + 0.5,
        vx:    (Math.random() - 0.5) * 0.3,
        vy:    -Math.random() * 0.4 - 0.1,
        alpha: Math.random() * 0.4 + 0.1,
        va:    (Math.random() - 0.5) * 0.005,
      })
    }

    let animId: number

    function draw() {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.forEach(p => {
        p.x     += p.vx
        p.y     += p.vy
        p.alpha += p.va

        if (p.y < -5)               p.y = canvas!.height + 5
        if (p.x < -5)               p.x = canvas!.width  + 5
        if (p.x > canvas!.width  + 5) p.x = -5
        if (p.alpha <= 0.05)        p.va = Math.abs(p.va)
        if (p.alpha >= 0.5)         p.va = -Math.abs(p.va)

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 215, 0, ${p.alpha})`
        ctx.fill()
      })

      animId = requestAnimationFrame(draw)
    }

    draw()

    const onResize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(255,215,0,0.07) 0%, transparent 60%), #0D0D0D' }}
    >
      {/* Canvas de partículas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ opacity: 0.6 }}
        aria-hidden="true"
      />

      {/* Grid decorativo */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,215,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,215,0,0.03) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Conteúdo */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center pt-24">

        {/* Selo de confiança */}
        <div className="inline-flex items-center gap-2 glass-gold rounded-full px-4 py-2 mb-8 animate-fade-in">
          <span className="text-gold-DEFAULT text-xs">🔒</span>
          <span className="text-gold-soft text-xs font-medium tracking-wide uppercase">
            100% Legal · Autorizado SPA/MF · Baseado na Loteria Federal
          </span>
        </div>

        {/* Headline */}
        <h1 className="font-display font-black text-hero text-white mb-6 animate-slide-up"
          style={{ animationDelay: '0.1s', opacity: 0, animationFillMode: 'forwards' }}
        >
          Sua chance de mudar{' '}
          <span
            className="relative inline-block"
            style={{
              backgroundImage: 'linear-gradient(135deg, #FFD700, #00FFA3)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            de vida
          </span>
          <br />começa com uma cota.
        </h1>

        {/* Subheadline */}
        <p className="text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed animate-slide-up"
          style={{ animationDelay: '0.2s', opacity: 0, animationFillMode: 'forwards' }}
        >
          Sorteios PIX com total transparência. Apuração pela Loteria Federal da Caixa,
          resultado público e auditável. Você acompanha tudo em tempo real.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-slide-up"
          style={{ animationDelay: '0.3s', opacity: 0, animationFillMode: 'forwards' }}
        >
          <Link href="/#sorteios" className="btn-primary text-base px-8 py-4 w-full sm:w-auto">
            🏆 Ver Sorteios Ativos
          </Link>
          <Link href="/#como-funciona" className="btn-secondary text-base px-8 py-4 w-full sm:w-auto">
            Como funciona?
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto animate-fade-in"
          style={{ animationDelay: '0.5s', opacity: 0, animationFillMode: 'forwards' }}
        >
          {[
            { valor: 'R$ 2M+',  label: 'Em prêmios pagos' },
            { valor: '48.000+', label: 'Participantes' },
            { valor: '100%',    label: 'Pagamentos confirmados' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <p className="font-display font-bold text-2xl sm:text-3xl text-gold-DEFAULT">
                {stat.valor}
              </p>
              <p className="text-text-muted text-xs sm:text-sm mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-float">
          <span className="text-text-muted text-xs tracking-widest uppercase">Scroll</span>
          <div className="w-5 h-8 rounded-full border border-[rgba(255,215,0,0.2)] flex items-start justify-center pt-1.5">
            <div className="w-1 h-2 rounded-full bg-gold-DEFAULT animate-bounce" />
          </div>
        </div>
      </div>
    </section>
  )
}
