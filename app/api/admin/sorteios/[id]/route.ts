// app/api/admin/sorteios/[id]/route.ts
// SorteioMax — API admin: buscar e editar sorteio por ID
// CORRIGIDO FASE 5: ao ativar sorteio, gera cotas se ainda não existirem

import { NextRequest, NextResponse } from 'next/server'
import { AdminService } from '@/lib/classes/admin-service'
import { AdminAuthService } from '@/lib/classes/admin-auth-service'
import { prisma } from '@/lib/prisma'

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

    // CORREÇÃO: ao ativar sorteio, gera cotas se não existirem
    if (body.status === 'ATIVO') {
      const cotasExistentes = await prisma.cota.count({
        where: { sorteioId: params.id }
      })

      if (cotasExistentes === 0) {
        const sorteio = await prisma.sorteio.findUnique({
          where: { id: params.id },
          select: { totalCotas: true }
        })

        if (sorteio && sorteio.totalCotas > 0) {
          // Gera cotas em lote
          const lote = Array.from({ length: sorteio.totalCotas }, (_: any, i: number) => ({
            sorteioId: params.id,
            numero: i + 1,
            status: 'DISPONIVEL' as any
          }))

          // Insere em chunks de 1000 para não estourar memória
          const CHUNK = 1000
          for (let i = 0; i < lote.length; i += CHUNK) {
            await prisma.cota.createMany({ data: lote.slice(i, i + CHUNK) })
          }

          await prisma.logAuditoria.create({
            data: {
              sorteioId: params.id,
              acao: 'COTAS_GERADAS',
              entidade: 'Cota',
              entidadeId: params.id,
              payload: {
                total: sorteio.totalCotas,
                adminEmail: session?.email ?? 'admin'
              } as any
            }
          })
        }
      }
    }

    const sorteioAtualizado = await adminService.editarSorteio(
      params.id,
      body,
      session?.email ?? 'admin'
    )
    return NextResponse.json(sorteioAtualizado)
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Erro ao editar sorteio' }, { status: 500 })
  }
}
