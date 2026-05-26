import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// POST - Upload de arquivo
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Processar FormData
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const category = formData.get('category') as string || 'geral'
    const projectId = formData.get('projectId') as string | null
    const description = formData.get('description') as string | null

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado' },
        { status: 400 }
      )
    }

    // Validar tamanho (máximo 50MB)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Máximo permitido: 50MB' },
        { status: 400 }
      )
    }

    // Validar tipo de arquivo
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'application/zip',
      'application/x-rar-compressed',
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de arquivo não permitido' },
        { status: 400 }
      )
    }

    // Gerar nome único para o arquivo
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 8)
    const originalName = file.name
    const extension = originalName.split('.').pop() || ''
    const sanitizedName = originalName
      .replace(/\.[^/.]+$/, '') // Remove extensão
      .replace(/[^a-zA-Z0-9_-]/g, '_') // Remove caracteres especiais
      .substring(0, 50) // Limita tamanho
    
    const uniqueFileName = `${sanitizedName}_${timestamp}_${randomString}.${extension}`

    // Definir diretório de upload
    const uploadDir = projectId 
      ? join(process.cwd(), 'public', 'uploads', projectId, category)
      : join(process.cwd(), 'public', 'uploads', 'geral', category)

    // Criar diretório se não existir
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Salvar arquivo
    const filePath = join(uploadDir, uniqueFileName)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Gerar URL pública
    const fileUrl = projectId
      ? `/uploads/${projectId}/${category}/${uniqueFileName}`
      : `/uploads/geral/${category}/${uniqueFileName}`

    // Gerar key única
    const fileKey = `${category}/${uniqueFileName}`

    // Salvar no banco de dados
    const documento = await prisma.file.create({
      data: {
        name: originalName,
        key: fileKey,
        url: fileUrl,
        size: file.size,
        type: file.type,
        category: category,
        description: description,
        projectId: projectId || null,
        userId: session.user.id,
        version: 1,
        isLatest: true,
      },
    })

    return NextResponse.json({
      success: true,
      documento: documento,
      message: 'Arquivo enviado com sucesso!'
    }, { status: 201 })

  } catch (error) {
    console.error('Erro no upload:', error)
    return NextResponse.json(
      { error: 'Erro interno ao processar upload' },
      { status: 500 }
    )
  }
}

// GET - Não permitido nesta rota
export async function GET() {
  return NextResponse.json(
    { error: 'Método não permitido. Use POST para upload.' },
    { status: 405 }
  )
}
