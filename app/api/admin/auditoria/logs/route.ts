// app/api/admin/auditoria/logs/route.ts
// SorteioMax — API admin: listar logs de auditoria em JSON

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sorteioId = searchParams.get('sorteioId') ?? undefined
    const take = parseInt(searchParams.get('take') ?? '200')

    const logs = await prisma.logAuditoria.findMany({
      where: sorteioId ? { sorteioId } : {},
      include: {
        usuario: { select: { email: true } },
        sorteio: { select: { titulo: true } }
      },
      orderBy: { criadoEm: 'desc' },
      take: Math.min(take, 1000)
    })

    return NextResponse.json(logs)
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro ao buscar logs' }, { status: 500 })
  }
}
