// app/api/pagamentos/[id]/status/route.ts
// SorteioMax — Polling de status do pagamento PIX

import { NextRequest, NextResponse } from 'next/server'
import { criarContainer } from '@/lib/container'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { pagamento } = criarContainer()
    const status = await pagamento.verificarStatus(params.id)
    return NextResponse.json({ status })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 404 })
  }
}
