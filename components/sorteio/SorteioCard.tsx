'use client'

import Link from 'next/link'
import { CountdownTimer } from '../ui/CountdownTimer'

interface SorteioCardProps {
  slug: string
  titulo: string
  premioDescricao: string
  premioValor: number
  valorCota: number
  totalCotas: number
  cotasVendidas: number
  dataApuracao: Date
  imagemUrl?: string
  status: 'ATIVO' | 'ESGOTADO' | 'AGUARDANDO_SORTEIO' | 'FINALIZADO'
}

export function SorteioCard({
  slug,
  titulo,
  premioDescricao,
  premioValor,
  valorCota,
  totalCotas,
  cotasVendidas,
  dataApuracao,
  imagemUrl,
  status,
}: SorteioCardProps) {
  const percentual = Math.round((cotasVendidas / totalCotas) * 100)
  const cotasRestantes = totalCotas - cotasVendidas

  return (
    <Link
      href={`/sorteios/${slug}`}
      className="group block relative rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-2"
      style={{
        background: 'linear-gradient(135deg, rgba(255,215,0,0.04) 0%, rgba(20,20,20,0.9) 60%)',
        border: '1px solid rgba(255,215,0,0.12)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
      }}
    >
      {/* Hover glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
        style={{ boxShadow: 'inset 0 0 40px rgba(255,215,0,0.06)' }} />

      {/* Badge de status */}
      <div className="absolute top-4 right-4 z-10">
        {status === 'ATIVO' && (
          <span className="badge badge-active">Ativo</span>
        )}
        {status === 'ESGOTADO' && (
          <span className="badge badge-waiting">Esgotado</span>
        )}
        {status === 'AGUARDANDO_SORTEIO' && (
          <span className="badge badge-waiting">Aguardando Sorteio</span>
        )}
        {status === 'FINALIZADO' && (
          <span className="badge badge-finished">Finalizado</span>
        )}
      </div>

      {/* Imagem do prêmio */}
      <div className="relative h-48 bg-bg-elevated overflow-hidden">
        {imagemUrl ? (
          <img
            src={imagemUrl}
            alt={premioDescricao}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gold-radial">
            <span className="text-6xl animate-float">🏆</span>
          </div>
        )}
        {/* Gradiente sobre a imagem */}
        <div className="absolute inset-0 bg-gradient-to-t from-bg-surface via-transparent to-transparent" />

        {/* Valor do prêmio sobre a imagem */}
        <div className="absolute bottom-3 left-4">
          <p className="text-text-muted text-xs uppercase tracking-wider">Prêmio</p>
          <p className="font-display font-bold text-2xl text-gold-DEFAULT">
            {premioValor.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
              maximumFractionDigits: 0,
            })}
          </p>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-5">
        <h3 className="font-display font-bold text-xl text-white mb-1 line-clamp-2">
          {titulo}
        </h3>
        <p className="text-text-muted text-sm mb-4 line-clamp-1">{premioDescricao}</p>

        {/* Progress de cotas */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-text-muted mb-2">
            <span>{cotasVendidas.toLocaleString('pt-BR')} cotas vendidas</span>
            <span className="text-gold-DEFAULT font-semibold">{percentual}%</span>
          </div>
          <div className="progress-wrap">
            <div className="progress-bar" style={{ width: `${percentual}%` }} />
          </div>
          <p className="text-right text-xs text-text-muted mt-1">
            {cotasRestantes > 0
              ? `${cotasRestantes.toLocaleString('pt-BR')} restantes`
              : 'Esgotado!'}
          </p>
        </div>

        <hr className="divider-gold mb-4" />

        {/* Footer do card */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-text-muted text-xs">Cota por apenas</p>
            <p className="font-bold text-lg text-white">
              {valorCota.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>

          {status === 'ATIVO' && cotasRestantes > 0 && (
            <span className="btn-primary py-2.5 px-5 text-sm pointer-events-none">
              Participar →
            </span>
          )}
          {(status === 'ESGOTADO' || cotasRestantes === 0) && (
            <span className="btn-secondary py-2.5 px-5 text-sm pointer-events-none opacity-60 cursor-not-allowed">
              Esgotado
            </span>
          )}
          {status === 'FINALIZADO' && (
            <span className="text-text-muted text-sm">Ver resultado →</span>
          )}
        </div>
      </div>
    </Link>
  )
}
