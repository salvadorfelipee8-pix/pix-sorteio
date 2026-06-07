// app/api/admin/auditoria/export/route.ts
// SorteioMax — API admin: exportar logs de auditoria em CSV

import { NextRequest, NextResponse } from 'next/server'
import { AdminService } from '@/lib/classes/admin-service'

const adminService = new AdminService()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sorteioId = searchParams.get('sorteioId') ?? undefined

    const csv = await adminService.exportarLogsCSV(sorteioId)

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="auditoria-${Date.now()}.csv"`
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro ao exportar logs' }, { status: 500 })
  }
}
