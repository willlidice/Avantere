// ============================================
// ☁️ AVANTERE - CLIENTE CLOUDFLARE R2 (STORAGE)
// ============================================

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Configuração do cliente S3 para Cloudflare R2
export const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME!;

// ============================================
// 📤 UPLOAD DE ARQUIVO
// ============================================

interface UploadParams {
  key: string;           // Caminho/nome do arquivo no bucket
  body: Buffer | Blob;   // Conteúdo do arquivo
  contentType: string;   // MIME type (ex: "image/png")
  metadata?: Record<string, string>;
}

export async function uploadFile({ key, body, contentType, metadata }: UploadParams) {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: contentType,
    Metadata: metadata,
  });

  await r2Client.send(command);

  // Retorna a URL pública do arquivo
  return getPublicUrl(key);
}

// ============================================
// 🗑️ DELETAR ARQUIVO
// ============================================

export async function deleteFile(key: string) {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await r2Client.send(command);
}

// ============================================
// 🔗 GERAR URL ASSINADA (Download temporário)
// ============================================

export async function getSignedDownloadUrl(key: string, expiresIn = 3600) {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(r2Client, command, { expiresIn });
}

// ============================================
// 🔗 GERAR URL ASSINADA (Upload direto do cliente)
// ============================================

export async function getSignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 3600
) {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(r2Client, command, { expiresIn });
}

// ============================================
// 🌐 URL PÚBLICA
// ============================================

export function getPublicUrl(key: string) {
  // Se tiver domínio público configurado no R2
  if (process.env.R2_PUBLIC_URL) {
    return `${process.env.R2_PUBLIC_URL}/${key}`;
  }
  
  // Fallback: URL do endpoint
  return `${process.env.R2_ENDPOINT}/${BUCKET_NAME}/${key}`;
}

// ============================================
// 🛠️ UTILITÁRIOS
// ============================================

/**
 * Gera um nome único para o arquivo
 */
export function generateFileKey(
  folder: string,
  originalName: string,
  userId?: string
): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split(".").pop() || "file";
  const safeName = originalName
    .replace(/[^a-zA-Z0-9.-]/g, "_")
    .substring(0, 50);

  const parts = [folder];
  if (userId) parts.push(userId);
  parts.push(`${timestamp}-${random}-${safeName}`);

  return parts.join("/");
}

/**
 * Valida o tipo do arquivo
 */
export function isAllowedFileType(
  mimeType: string,
  allowedTypes: string[]
): boolean {
  return allowedTypes.some((type) => {
    if (type.endsWith("/*")) {
      // Wildcard (ex: "image/*")
      const category = type.replace("/*", "");
      return mimeType.startsWith(category);
    }
    return mimeType === type;
  });
}

/**
 * Tipos de arquivo permitidos por categoria
 */
export const ALLOWED_FILE_TYPES = {
  images: ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"],
  documents: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],
  drawings: [
    "application/acad",           // DWG
    "application/x-autocad",      // DWG
    "image/vnd.dwg",              // DWG
    "application/dxf",            // DXF
    "image/vnd.dxf",              // DXF
  ],
  bim: [
    "application/x-step",         // IFC
    "application/ifc",            // IFC
  ],
  all: ["*/*"],
};

/**
 * Tamanho máximo de arquivo (em bytes)
 */
export const MAX_FILE_SIZE = {
  image: 10 * 1024 * 1024,      // 10MB
  document: 50 * 1024 * 1024,   // 50MB
  drawing: 100 * 1024 * 1024,   // 100MB
  bim: 500 * 1024 * 1024,       // 500MB
  default: 50 * 1024 * 1024,    // 50MB
};
