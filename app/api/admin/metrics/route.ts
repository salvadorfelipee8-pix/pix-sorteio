// app/api/admin/metrics/route.ts
// SorteioMax — API de métricas para o dashboard admin

import { NextRequest, NextResponse } from 'next/server'
import { AdminService } from '@/lib/classes/admin-service'

const adminService = new AdminService()

export async function GET(_request: NextRequest) {
  try {
    const metricas = await adminService.getMetricas()
    return NextResponse.json(metricas)
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro ao buscar métricas' }, { status: 500 })
  }
}
