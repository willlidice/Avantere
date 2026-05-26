import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { unlink } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

interface RouteParams {
  params: { id: string }
}

// GET - Buscar documento específico
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const file = await prisma.file.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } }
      }
    })

    if (!file) {
      return NextResponse.json({ error: 'Documento não encontrado' }, { status: 404 })
    }

    // Buscar histórico de versões
    let versoes: any[] = []
    const originalId = file.originalFileId || file.id
    
    if (file.version > 1 || file.originalFileId) {
      versoes = await prisma.file.findMany({
        where: {
          OR: [
            { id: originalId },
            { originalFileId: originalId }
          ]
        },
        orderBy: { version: 'desc' },
        select: {
          id: true,
          version: true,
          isLatest: true,
          size: true,
          createdAt: true,
          user: { select: { name: true } }
        }
      })
    }

    return NextResponse.json({
      documento: {
        id: file.id,
        nome: file.name,
        url: file.url,
        tipo: file.type,
        tamanho: file.size,
        categoria: file.category,
        versao: file.version,
        versaoAtual: file.isLatest,
        descricao: file.description,
        projeto: file.project,
        enviadoPor: file.user,
        criadoEm: file.createdAt.toISOString(),
        atualizadoEm: file.updatedAt.toISOString()
      },
      versoes: versoes.map(v => ({
        id: v.id,
        versao: v.version,
        atual: v.isLatest,
        tamanho: v.size,
        enviadoPor: v.user?.name || 'Usuário',
        criadoEm: v.createdAt.toISOString()
      }))
    })

  } catch (error) {
    console.error('Erro ao buscar documento:', error)
    return NextResponse.json({ error: 'Erro ao buscar documento' }, { status: 500 })
  }
}

// PUT - Atualizar metadados do documento
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { nome, categoria, descricao, projetoId } = body

    const existingFile = await prisma.file.findUnique({
      where: { id: params.id }
    })

    if (!existingFile) {
      return NextResponse.json({ error: 'Documento não encontrado' }, { status: 404 })
    }

    const updatedFile = await prisma.file.update({
      where: { id: params.id },
      data: {
        name: nome || existingFile.name,
        category: categoria || existingFile.category,
        description: descricao !== undefined ? descricao : existingFile.description,
        projectId: projetoId !== undefined ? projetoId : existingFile.projectId
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Documento atualizado com sucesso',
      documento: {
        id: updatedFile.id,
        nome: updatedFile.name,
        url: updatedFile.url,
        tipo: updatedFile.type,
        tamanho: updatedFile.size,
        categoria: updatedFile.category,
        versao: updatedFile.version,
        descricao: updatedFile.description,
        projeto: updatedFile.project,
        enviadoPor: updatedFile.user
      }
    })

  } catch (error) {
    console.error('Erro ao atualizar documento:', error)
    return NextResponse.json({ error: 'Erro ao atualizar documento' }, { status: 500 })
  }
}

// DELETE - Excluir documento
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const file = await prisma.file.findUnique({
      where: { id: params.id }
    })

    if (!file) {
      return NextResponse.json({ error: 'Documento não encontrado' }, { status: 404 })
    }

    // Excluir arquivo físico
    const filePath = path.join(process.cwd(), 'public', file.key)
    if (existsSync(filePath)) {
      try {
        await unlink(filePath)
      } catch (err) {
        console.error('Erro ao excluir arquivo físico:', err)
      }
    }

    // Se era a versão mais recente, promover a anterior
    if (file.isLatest && file.originalFileId) {
      const previousVersion = await prisma.file.findFirst({
        where: {
          originalFileId: file.originalFileId,
          id: { not: file.id }
        },
        orderBy: { version: 'desc' }
      })

      if (previousVersion) {
        await prisma.file.update({
          where: { id: previousVersion.id },
          data: { isLatest: true }
        })
      }
    }

    // Excluir do banco
    await prisma.file.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Documento excluído com sucesso'
    })

  } catch (error) {
    console.error('Erro ao excluir documento:', error)
    return NextResponse.json({ error: 'Erro ao excluir documento' }, { status: 500 })
  }
}
