import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Listar documentos
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const categoria = searchParams.get('categoria')
    const busca = searchParams.get('busca')
    const projetoId = searchParams.get('projetoId')
    const apenasUltimas = searchParams.get('apenasUltimas') !== 'false'

    // Construir filtro
    const where: any = {}

    // Por padrão, mostrar apenas versões mais recentes
    if (apenasUltimas) {
      where.isLatest = true
    }

    // Filtro por categoria
    if (categoria && categoria !== 'todos') {
      where.category = categoria
    }

    // Filtro por projeto
    if (projetoId) {
      where.projectId = projetoId
    }

    // Filtro por busca (nome ou descrição)
    if (busca) {
      where.OR = [
        { name: { contains: busca, mode: 'insensitive' } },
        { description: { contains: busca, mode: 'insensitive' } }
      ]
    }

    const files = await prisma.file.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } }
      }
    })

    const documentos = files.map(file => ({
      id: file.id,
      nome: file.name,
      url: file.url,
      tipo: file.type,
      tamanho: file.size,
      categoria: file.category,
      versao: file.version,
      versaoAtual: file.isLatest,
      descricao: file.description,
      projeto: file.project ? {
        id: file.project.id,
        nome: file.project.name
      } : null,
      enviadoPor: {
        id: file.user.id,
        nome: file.user.name || 'Usuário',
        email: file.user.email
      },
      criadoEm: file.createdAt.toISOString()
    }))

    return NextResponse.json({ 
      documentos,
      total: documentos.length 
    })
    
  } catch (error) {
    console.error('Erro ao listar documentos:', error)
    return NextResponse.json(
      { error: 'Erro ao listar documentos', documentos: [] },
      { status: 500 }
    )
  }
}
