import { S3Client, PutObjectCommand, DeleteObjectCommand, DeleteObjectsCommand, GetObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3"

export const r2 = new S3Client({
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

export async function baixarDoR2(chave: string): Promise<Buffer> {
  const resp = await r2.send(
    new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: chave,
    }),
  )
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stream = resp.Body as any
  const chunks: Buffer[] = []
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}

export async function deletarDoR2(chave: string): Promise<void> {
  await r2.send(
    new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: chave,
    }),
  )
}

export async function deletarPrefixoDoR2(prefixo: string): Promise<void> {
  let continuationToken: string | undefined

  do {
    const resp = await r2.send(
      new ListObjectsV2Command({
        Bucket: process.env.R2_BUCKET_NAME!,
        Prefix: prefixo,
        ContinuationToken: continuationToken,
      }),
    )

    const chaves = (resp.Contents ?? []).map((o) => o.Key).filter((k): k is string => !!k)
    if (chaves.length > 0) {
      await r2.send(
        new DeleteObjectsCommand({
          Bucket: process.env.R2_BUCKET_NAME!,
          Delete: { Objects: chaves.map((Key) => ({ Key })) },
        }),
      )
    }

    continuationToken = resp.IsTruncated ? resp.NextContinuationToken : undefined
  } while (continuationToken)
}
