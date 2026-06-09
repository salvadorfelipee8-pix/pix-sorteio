// app/sorteios/[slug]/resultado/page.tsx
// SorteioMax — Página pública de resultado do sorteio (auditável)

import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Trophy, Lock, ExternalLink, CheckCircle2 } from 'lucide-react'

export const revalidate = 60

interface Props {
  params: { slug: string }
}

export default async function ResultadoPage({ params }: Props) {
  const sorteio = await prisma.sorteio.findUnique({
    where: { slug: params.slug },
    include: {
      cotas: {
        where: { status: 'PAGA' as any },
        include: {
          usuario: { select: { nome: true } }
        },
        orderBy: { numero: 'asc' }
      }
    }
  })

  if (!sorteio) notFound()

  if (sorteio.status !== 'FINALIZADO') {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center p-4">
        <div className="text-center">
          <Trophy className="text-zinc-600 mx-auto mb-4" size={48} />
          <h1 className="text-white text-2xl font-bold mb-2">Sorteio ainda não realizado</h1>
          <p className="text-zinc-500">O resultado será publicado após a apuração.</p>
          <Link href={`/sorteios/${params.slug}`} className="mt-6 inline-block text-[#FFD700] hover:underline">
            ← Voltar ao sorteio
          </Link>
        </div>
      </div>
    )
  }

  const cotaVencedora = sorteio.cotas.find((c: any) => c.numero === sorteio.cotaVencedora)

  return (
    <div className="min-h-screen bg-[#0D0D0D]">
      {/* Header */}
      <div className="bg-[#FFD700] py-12 text-center">
        <Trophy className="mx-auto mb-4 text-black" size={56} />
        <h1 className="text-black text-4xl font-black tracking-tight">RESULTADO OFICIAL</h1>
        <p className="text-black/70 text-lg mt-2">{sorteio.titulo}</p>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">

        {/* Cota vencedora */}
        <div className="bg-[#111111] border border-[#FFD700]/40 rounded-2xl p-8 text-center">
          <p className="text-zinc-500 text-sm uppercase tracking-widest mb-4">Cota Vencedora</p>
          <div className="text-8xl font-black text-[#FFD700] mb-4">
            #{String(sorteio.cotaVencedora).padStart(4, '0')}
          </div>
          {cotaVencedora?.usuario ? (
            <div className="inline-flex items-center gap-2 bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-full px-6 py-2">
              <Trophy size={16} className="text-[#FFD700]" />
              <span className="text-white font-semibold">{cotaVencedora.usuario.nome}</span>
            </div>
          ) : (
            <p className="text-zinc-500">Cota sem participante registrado</p>
          )}
          <p className="text-zinc-400 mt-4 text-lg">{sorteio.premioDescricao}</p>
        </div>

        {/* Auditoria */}
        <div className="bg-[#111111] border border-zinc-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Lock size={18} className="text-[#00FFA3]" />
            <h2 className="text-white font-semibold">Transparência e Auditoria</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="bg-[#0D0D0D] rounded-lg p-4">
              <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Número Loteria Federal</p>
              <p className="text-white font-bold text-xl">{sorteio.loteriaResultado}</p>
              <p className="text-zinc-600 text-xs mt-1">{sorteio.loteriaSerie}º Prêmio</p>
            </div>
            <div className="bg-[#0D0D0D] rounded-lg p-4">
              <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Data de Apuração</p>
              <p className="text-white font-bold">
                {new Date(sorteio.dataApuracao).toLocaleDateString('pt-BR', {
                  day: '2-digit', month: 'long', year: 'numeric'
                })}
              </p>
            </div>
          </div>

          <div className="bg-[#0D0D0D] rounded-lg p-4">
            <p className="text-zinc-500 text-xs uppercase tracking-wider mb-2">Hash SHA-256 da Base (auditável)</p>
            <p className="text-zinc-400 font-mono text-xs break-all">{sorteio.baseHashSha256}</p>
          </div>

          <div className="bg-[#0D0D0D] rounded-lg p-4">
            <p className="text-zinc-500 text-xs uppercase tracking-wider mb-2">Algoritmo de Apuração</p>
            <p className="text-zinc-400 text-xs">
              SHA256({sorteio.loteriaResultado}-{sorteio.loteriaSerie}-BASE_HASH) MOD {sorteio.totalCotas} + 1
            </p>
          </div>

          <div className="flex items-start gap-3 bg-[#00FFA3]/5 border border-[#00FFA3]/20 rounded-lg p-4">
            <CheckCircle2 size={16} className="text-[#00FFA3] shrink-0 mt-0.5" />
            <p className="text-zinc-400 text-xs">
              O resultado é determinístico e verificável. Qualquer pessoa pode confirmar o vencedor usando o hash da base,
              o número sorteado pela Loteria Federal e o algoritmo acima. O hash da base foi gerado e registrado
              em <strong className="text-white">{new Date(sorteio.baseCongeladaEm!).toLocaleString('pt-BR')}</strong> antes do sorteio.
            </p>
          </div>
        </div>

        {/* Lista de participantes */}
        <div className="bg-[#111111] border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-800">
            <h2 className="text-white font-semibold">Participantes ({sorteio.cotas.length} cotas)</h2>
          </div>
          <div className="max-h-96 overflow-y-auto divide-y divide-zinc-800">
            {sorteio.cotas.map((c: any) => {
              const venceu = c.numero === sorteio.cotaVencedora
              return (
                <div
                  key={c.id}
                  className={`flex items-center justify-between px-6 py-3 text-sm ${venceu ? 'bg-[#FFD700]/5' : 'hover:bg-white/[0.01]'}`}
                >
                  <span className={`font-mono font-bold ${venceu ? 'text-[#FFD700]' : 'text-zinc-400'}`}>
                    #{String(c.numero).padStart(4, '0')}
                  </span>
                  <span className={venceu ? 'text-white font-semibold' : 'text-zinc-500'}>
                    {c.usuario?.nome ?? '—'}
                  </span>
                  {venceu && <Trophy size={14} className="text-[#FFD700]" />}
                </div>
              )
            })}
          </div>
        </div>

        {/* Compliance */}
        <div className="text-center text-zinc-600 text-xs space-y-1 pb-8">
          <p>Certificado SPA/MF: {sorteio.certificadoSpaMf} | CNPJ: {sorteio.cnpjPromotora}</p>
          <p>Sorteio baseado na Loteria Federal da Caixa Econômica Federal — 100% legal e auditável.</p>
        </div>
      </div>
    </div>
  )
}
