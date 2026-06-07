// middleware.ts  (raiz do projeto)
// SorteioMax — Proteção de rotas admin via JWT cookie
// IMPACTO: Afeta TODAS as rotas /admin/* e /api/admin/*

import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const ADMIN_ROUTES = ['/admin']
const ADMIN_API_ROUTES = ['/api/admin']
const LOGIN_PAGE = '/admin/login'

function getSecret(): Uint8Array {
  const secret = process.env.ADMIN_JWT_SECRET ?? 'fallback-dev-secret-change-in-prod'
  return new TextEncoder().encode(secret)
}

async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, getSecret())
    return true
  } catch {
    return false
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isAdminRoute = ADMIN_ROUTES.some(r => pathname.startsWith(r))
  const isAdminApi = ADMIN_API_ROUTES.some(r => pathname.startsWith(r))

  if (!isAdminRoute && !isAdminApi) {
    return NextResponse.next()
  }

  // Página de login é sempre acessível
  if (pathname === LOGIN_PAGE) {
    return NextResponse.next()
  }

  const token = request.cookies.get('admin_session')?.value

  if (!token) {
    if (isAdminApi) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    return NextResponse.redirect(new URL(LOGIN_PAGE, request.url))
  }

  const valid = await verifyAdminToken(token)

  if (!valid) {
    if (isAdminApi) {
      return NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 401 })
    }
    const response = NextResponse.redirect(new URL(LOGIN_PAGE, request.url))
    response.cookies.delete('admin_session')
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*']
}
