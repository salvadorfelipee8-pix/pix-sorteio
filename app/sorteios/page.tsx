// app/sorteios/page.tsx
// SorteioMax — Página de listagem de sorteios ativos

import { Navbar } from '@/components/ui/Navbar'
import { Footer } from '@/components/ui/Footer'
import { SorteioCard } from '@/components/sorteio/SorteioCard'
import { prisma } from '@/lib/prisma'

async function getSorteiosAtivos() {
  try {
    return await prisma.sorteio.findMany({
      where: { status: 'ATIVO' },
      orderBy: { dataApuracao: 'asc' }
    })
  } catch {
    return []
  }
}

export default async function SorteiosPage() {
  const sorteios = await getSorteiosAtivos()

  return (
    <main className="min-h-screen bg-bg-primary">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-28 pb-20">
        <div className="mb-12">
          <h1 className="font-display font-bold text-4xl text-white mb-3">
            Sorteios em Andamento
          </h1>
          <p className="text-text-secondary text-lg">
            Escolha seu favorito e garanta suas cotas agora.
          </p>
        </div>

        {sorteios.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sorteios.map((s: any, i: number) => (
              <div key={s.id} className="animate-slide-up"
                style={{ animationDelay: `${i * 0.1}s`, opacity: 0, animationFillMode: 'forwards' }}>
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
                  status={s.status}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 glass rounded-2xl">
            <p className="text-6xl mb-6">🏆</p>
            <p className="font-display font-bold text-2xl text-white mb-3">
              Novos sorteios em breve
            </p>
            <p className="text-text-muted">Volte em breve para participar.</p>
          </div>
        )}
      </div>
      <Footer />
    </main>
  )
}
