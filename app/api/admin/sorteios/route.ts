// app/api/admin/sorteios/route.ts
// SorteioMax — API admin: listar e criar sorteios

import { NextRequest, NextResponse } from 'next/server'
import { AdminService } from '@/lib/classes/admin-service'
import { AdminAuthService } from '@/lib/classes/admin-auth-service'

const adminService = new AdminService()

export async function GET(_request: NextRequest) {
  try {
    const sorteios = await adminService.listarSorteios()
    return NextResponse.json(sorteios)
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro ao listar sorteios' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await AdminAuthService.getSessionFromCookies()
    const body = await request.json()

    const sorteio = await adminService.criarSorteio(body, session?.email ?? 'admin')
    return NextResponse.json(sorteio, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Erro ao criar sorteio' }, { status: 500 })
  }
}
