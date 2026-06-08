import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

export async function uploadJpgParaR2(
  chave: string,
  buffer: Buffer,
): Promise<string> {
  await r2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: chave,
      Body: buffer,
      ContentType: "image/jpeg",
    }),
  )
  return `${process.env.R2_PUBLIC_URL}/${chave}`
}

export async function uploadArquivoParaR2(
  chave: string,
  buffer: Buffer,
  contentType: string,
): Promise<string> {
  await r2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: chave,
      Body: buffer,
      ContentType: contentType,
    }),
  )
  return `${process.env.R2_PUBLIC_URL}/${chave}`
}

export async function deletarDoR2(chave: string): Promise<void> {
  await r2.send(
    new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: chave,
    }),
  )
}
