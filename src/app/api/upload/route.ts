// ============================================
// AVANTERE - UPLOAD DE ARQUIVOS (CORRIGIDO)
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// Tipos de upload permitidos
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nao autorizado" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const projectId = formData.get("projectId") as string | null;
    const taskId = formData.get("taskId") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo enviado" },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { 
          error: "Tipo de arquivo nao permitido",
          receivedType: file.type,
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: "Arquivo muito grande (max: 10MB)",
          maxSizeMB: MAX_FILE_SIZE / (1024 * 1024),
          fileSizeMB: (file.size / (1024 * 1024)).toFixed(2),
        },
        { status: 400 }
      );
    }

    if (projectId) {
      const project = await db.project.findUnique({
        where: { id: projectId },
        select: { id: true },
      });
      
      if (!project) {
        return NextResponse.json(
          { error: "Projeto nao encontrado" },
          { status: 404 }
        );
      }
    }

    if (taskId) {
      const task = await db.task.findUnique({
        where: { id: taskId },
        select: { id: true },
      });
      
      if (!task) {
        return NextResponse.json(
          { error: "Tarefa nao encontrada" },
          { status: 404 }
        );
      }
    }

    const timestamp = Date.now();
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const key = "uploads/" + session.user.id + "/" + timestamp + "-" + safeFileName;
    const url = "/api/files/" + key;

    const savedFile = await db.file.create({
      data: {
        name: file.name,
        key: key,
        url: url,
        size: file.size,
        type: file.type,
        projectId: projectId,
        taskId: taskId,
        userId: session.user.id,
      },
    });

    return NextResponse.json(
      {
        message: "Upload realizado com sucesso",
        file: {
          id: savedFile.id,
          name: savedFile.name,
          url: savedFile.url,
          type: savedFile.type,
          size: savedFile.size,
        },
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Erro no upload:", error);
    
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: "Metodo nao permitido. Use POST para upload." },
    { status: 405 }
  );
}