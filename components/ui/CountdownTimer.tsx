'use client'

import { useEffect, useState } from 'react'

interface CountdownTimerProps {
  targetDate: Date
  onExpire?: () => void
}

interface TimeLeft {
  dias: number
  horas: number
  minutos: number
  segundos: number
}

function calcularTempoRestante(target: Date): TimeLeft {
  const diff = Math.max(0, target.getTime() - Date.now())
  return {
    dias:     Math.floor(diff / 86_400_000),
    horas:    Math.floor((diff % 86_400_000) / 3_600_000),
    minutos:  Math.floor((diff % 3_600_000) / 60_000),
    segundos: Math.floor((diff % 60_000) / 1_000),
  }
}

function DigitBlock({ value, label }: { value: number; label: string }) {
  const [prev, setPrev] = useState(value)
  const [animate, setAnimate] = useState(false)

  useEffect(() => {
    if (value !== prev) {
      setAnimate(true)
      const t = setTimeout(() => { setPrev(value); setAnimate(false) }, 300)
      return () => clearTimeout(t)
    }
  }, [value, prev])

  const formatted = String(value).padStart(2, '0')

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative w-16 sm:w-20 h-16 sm:h-20 glass-gold rounded-xl flex items-center justify-center overflow-hidden"
        style={{ boxShadow: '0 0 20px rgba(0,255,163,0.1)' }}
      >
        {/* Linha divisória central */}
        <div className="absolute inset-x-0 top-1/2 h-px bg-black/30 z-10" />

        <span
          className={`timer-digit text-3xl sm:text-4xl ${animate ? 'animate-digit-roll' : ''}`}
          style={{ textShadow: '0 0 20px rgba(0,255,163,0.6)' }}
        >
          {formatted}
        </span>
      </div>
      <span className="timer-label mt-2">{label}</span>
    </div>
  )
}

export function CountdownTimer({ targetDate, onExpire }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calcularTempoRestante(targetDate))
  const [expired, setExpired] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      const t = calcularTempoRestante(targetDate)
      setTimeLeft(t)

      const total = t.dias + t.horas + t.minutos + t.segundos
      if (total === 0 && !expired) {
        setExpired(true)
        onExpire?.()
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [targetDate, expired, onExpire])

  if (expired) {
    return (
      <div className="flex items-center gap-2 text-gold-DEFAULT font-display font-bold text-lg animate-glow-pulse">
        <span>🏆</span>
        <span>Sorteio em andamento...</span>
      </div>
    )
  }

  return (
    <div>
      <p className="text-text-muted text-xs uppercase tracking-widest mb-4 text-center">
        Tempo para o sorteio
      </p>
      <div className="flex items-start gap-2 sm:gap-4">
        <DigitBlock value={timeLeft.dias}     label="Dias"     />
        <Separator />
        <DigitBlock value={timeLeft.horas}    label="Horas"    />
        <Separator />
        <DigitBlock value={timeLeft.minutos}  label="Minutos"  />
        <Separator />
        <DigitBlock value={timeLeft.segundos} label="Segundos" />
      </div>
    </div>
  )
}

function Separator() {
  return (
    <div className="flex flex-col gap-2 mt-4">
      <div className="w-1 h-1 rounded-full bg-mint-DEFAULT opacity-60 animate-glow-pulse" />
      <div className="w-1 h-1 rounded-full bg-mint-DEFAULT opacity-60 animate-glow-pulse" style={{ animationDelay: '0.5s' }} />
    </div>
  )
}
