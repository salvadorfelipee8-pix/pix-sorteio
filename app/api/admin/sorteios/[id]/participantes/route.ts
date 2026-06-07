// app/api/admin/sorteios/[id]/participantes/route.ts
// SorteioMax — API admin: listar participantes de um sorteio

import { NextRequest, NextResponse } from 'next/server'
import { AdminService } from '@/lib/classes/admin-service'

const adminService = new AdminService()

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const participantes = await adminService.listarParticipantes(params.id)
    return NextResponse.json(participantes)
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro ao listar participantes' }, { status: 500 })
  }
}
