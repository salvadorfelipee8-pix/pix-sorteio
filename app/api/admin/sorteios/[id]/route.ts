// app/api/admin/sorteios/[id]/route.ts
// SorteioMax — API admin: buscar e editar sorteio por ID

import { NextRequest, NextResponse } from 'next/server'
import { AdminService } from '@/lib/classes/admin-service'
import { AdminAuthService } from '@/lib/classes/admin-auth-service'

const adminService = new AdminService()

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sorteio = await adminService.getSorteio(params.id)
    if (!sorteio) return NextResponse.json({ error: 'Sorteio não encontrado' }, { status: 404 })
    return NextResponse.json(sorteio)
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro ao buscar sorteio' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await AdminAuthService.getSessionFromCookies()
    const body = await request.json()
    const sorteio = await adminService.editarSorteio(params.id, body, session?.email ?? 'admin')
    return NextResponse.json(sorteio)
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Erro ao editar sorteio' }, { status: 500 })
  }
}
