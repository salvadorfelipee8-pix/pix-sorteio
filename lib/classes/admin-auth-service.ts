// lib/classes/admin-auth-service.ts
// SorteioMax — Serviço de autenticação do painel admin
// IMPACTO: Usado por middleware.ts e todas as rotas /api/admin/*

import { SignJWT, jwtVerify, JWTPayload } from 'jose'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'

export interface AdminPayload extends JWTPayload {
  email: string
  role: 'ADMIN' | 'SUPER_ADMIN'
}

export interface LoginResult {
  success: boolean
  token?: string
  error?: string
}

export class AdminAuthService {
  private static readonly COOKIE_NAME = 'admin_session'
  private static readonly TOKEN_TTL = 60 * 60 * 8 // 8 horas

  private static getSecret(): Uint8Array {
    const secret = process.env.ADMIN_JWT_SECRET
    if (!secret) throw new Error('ADMIN_JWT_SECRET não configurado')
    return new TextEncoder().encode(secret)
  }

  static async login(email: string, password: string): Promise<LoginResult> {
    const adminEmail = process.env.ADMIN_EMAIL
    const adminHash = process.env.ADMIN_PASSWORD_HASH

    if (!adminEmail || !adminHash) {
      return { success: false, error: 'Credenciais admin não configuradas' }
    }

    if (email !== adminEmail) {
      return { success: false, error: 'Credenciais inválidas' }
    }

    const valid = await bcrypt.compare(password, adminHash)
    if (!valid) {
      return { success: false, error: 'Credenciais inválidas' }
    }

    const payload: AdminPayload = { email, role: 'ADMIN' }

    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(`${this.TOKEN_TTL}s`)
      .sign(this.getSecret())

    return { success: true, token }
  }

  static async verifyToken(token: string): Promise<AdminPayload | null> {
    try {
      const { payload } = await jwtVerify(token, this.getSecret())
      return payload as AdminPayload
    } catch {
      return null
    }
  }

  static async getSessionFromCookies(): Promise<AdminPayload | null> {
    try {
      const cookieStore = cookies()
      const token = cookieStore.get(this.COOKIE_NAME)?.value
      if (!token) return null
      return this.verifyToken(token)
    } catch {
      return null
    }
  }

  static getCookieName(): string {
    return this.COOKIE_NAME
  }

  static getTokenTTL(): number {
    return this.TOKEN_TTL
  }
}
