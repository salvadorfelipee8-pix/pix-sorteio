// app/api/admin/sorteios/[id]/congelar/route.ts
// SorteioMax — API admin: congelar base com hash SHA-256
// IMPACTO: CongelamentoService → AuditoriaService, CotaService (bloqueia compras)

import { NextRequest, NextResponse } from 'next/server'
import { CongelamentoService } from '@/lib/classes/congelamento-service'
import { AdminAuthService } from '@/lib/classes/admin-auth-service'

const congelamentoService = new CongelamentoService()

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await AdminAuthService.getSessionFromCookies()
    const adminEmail = session?.email ?? 'admin'

    const resultado = await congelamentoService.congelarBase(params.id, adminEmail)

    if (!resultado.success) {
      return NextResponse.json({ error: resultado.erro }, { status: 400 })
    }

    return NextResponse.json(resultado)
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro ao congelar base' }, { status: 500 })
  }
}
