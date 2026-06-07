// app/api/admin/auth/route.ts
// SorteioMax — API de autenticação admin (login + logout)

import { NextRequest, NextResponse } from 'next/server'
import { AdminAuthService } from '@/lib/classes/admin-auth-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, action } = body

    if (action === 'logout') {
      const response = NextResponse.json({ success: true })
      response.cookies.delete(AdminAuthService.getCookieName())
      return response
    }

    if (!email || !password) {
      return NextResponse.json({ error: 'Email e senha obrigatórios' }, { status: 400 })
    }

    const result = await AdminAuthService.login(email, password)

    if (!result.success || !result.token) {
      return NextResponse.json({ error: result.error }, { status: 401 })
    }

    const response = NextResponse.json({ success: true })
    response.cookies.set(AdminAuthService.getCookieName(), result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: AdminAuthService.getTokenTTL(),
      path: '/'
    })

    return response
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
