'use client'
// app/providers.tsx
// SorteioMax — SessionProvider do NextAuth (client component wrapper)

import { SessionProvider } from 'next-auth/react'

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
