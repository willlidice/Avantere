import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Listar projetos
export async function GET(request: NextRequest) {
  try {
    // Por enquanto, retorna array vazio se a tabela Project não existir
    // Quando o módulo de Obras for implementado, isso será atualizado
    
    // Tenta buscar projetos se a tabela existir
    let projects: any[] = []
    
    try {
      // Verifica se existe a tabela/model Project no Prisma
      // @ts-ignore - Project pode não existir ainda
      if (prisma.project) {
        // @ts-ignore
        projects = await prisma.project.findMany({
          select: {
            id: true,
            name: true,
          },
          orderBy: {
            name: 'asc'
          }
        })
      }
    } catch (e) {
      // Tabela não existe ainda, retorna array vazio
      console.log('Model Project ainda não existe no schema')
    }

    return NextResponse.json({ 
      projects,
      total: projects.length 
    })

  } catch (error) {
    console.error('Erro ao buscar projetos:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar projetos', projects: [] },
      { status: 200 } // Retorna 200 com array vazio para não quebrar o frontend
    )
  }
}
