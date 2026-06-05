import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'SorteioMax — Sorteios PIX Premium',
    template: '%s | SorteioMax',
  },
  description:
    'A plataforma de sorteios PIX mais transparente e segura do Brasil. Sorteios baseados na Loteria Federal, com total conformidade legal.',
  keywords: ['sorteio pix', 'sorteio online', 'loteria federal', 'cotas sorteio', 'pix sorteio'],
  authors: [{ name: 'SorteioMax' }],
  creator: 'SorteioMax',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: 'SorteioMax',
    title: 'SorteioMax — Sorteios PIX Premium',
    description: 'Sorteios transparentes, seguros e 100% legais. Baseados na Loteria Federal.',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SorteioMax — Sorteios PIX Premium',
    description: 'Sorteios transparentes, seguros e 100% legais.',
  },
  robots: {
    index: true,
    follow: true,
  },
  themeColor: '#0D0D0D',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,700;1,9..40,300&family=JetBrains+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {/* Grain overlay sutil — atmosfera luxury */}
        <div className="noise-overlay" aria-hidden="true" />
        {children}
      </body>
    </html>
  )
}
