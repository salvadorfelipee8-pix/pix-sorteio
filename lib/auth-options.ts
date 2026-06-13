// lib/auth-options.ts
// SorteioMax — Configuração NextAuth para participantes
// IMPACTO: Usado por todas as rotas protegidas de usuário (/api/minha-conta, /api/pagamentos/criar)

import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { criarContainer } from './container'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        try {
          const { auth } = criarContainer()
          const usuario = await auth.autenticar(credentials.email, credentials.password)
          return {
            id: usuario.id,
            name: usuario.nome,
            email: usuario.email,
            role: usuario.role
          }
        } catch {
          return null
        }
      }
    })
  ],
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/auth/login'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id
        ;(session.user as any).role = token.role
      }
      return session
    }
  },
  secret: process.env.NEXTAUTH_SECRET
}
