// app/api/auth/[...nextauth]/route.ts
// SorteioMax — Handler do NextAuth

import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth-options'

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
