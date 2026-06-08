import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3"
import { readFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = join(__dirname, "..", ".env")

// Carregar .env manualmente
const env = readFileSync(envPath, "utf-8")
  .split("\n")
  .filter((l) => l && !l.startsWith("#"))
  .reduce((acc, line) => {
    const [k, ...v] = line.split("=")
    acc[k.trim()] = v.join("=").replace(/^"|"$/g, "").trim()
    return acc
  }, {})

const {
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET_NAME,
  R2_PUBLIC_URL,
} = env

console.log("\n=== TESTE R2 CLOUDFLARE ===\n")
console.log("Account ID:", R2_ACCOUNT_ID)
console.log("Bucket:    ", R2_BUCKET_NAME)
console.log("Endpoint:  ", `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`)
console.log("Public URL:", R2_PUBLIC_URL)
console.log("")

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
})

const CHAVE_TESTE = "test/avantere-r2-test.txt"
const CONTEUDO = `Avantere R2 test — ${new Date().toISOString()}`

async function testar() {
  let ok = 0
  let fail = 0

  // 1. Listar bucket (valida credenciais)
  process.stdout.write("1. Listar bucket... ")
  try {
    const res = await r2.send(
      new ListObjectsV2Command({ Bucket: R2_BUCKET_NAME, MaxKeys: 5 })
    )
    const count = res.KeyCount ?? 0
    console.log(`✓ OK (${count} objetos existentes)`)
    ok++
  } catch (e) {
    console.log(`✗ FALHOU: ${e.message}`)
    fail++
    console.log("\nVerifique credenciais e nome do bucket. Abortando.")
    process.exit(1)
  }

  // 2. Upload
  process.stdout.write("2. Upload arquivo teste... ")
  try {
    await r2.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: CHAVE_TESTE,
        Body: CONTEUDO,
        ContentType: "text/plain",
      })
    )
    console.log("✓ OK")
    ok++
  } catch (e) {
    console.log(`✗ FALHOU: ${e.message}`)
    fail++
  }

  // 3. Download (verificar integridade)
  process.stdout.write("3. Download + verificar conteúdo... ")
  try {
    const res = await r2.send(
      new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: CHAVE_TESTE })
    )
    const body = await res.Body.transformToString()
    if (body === CONTEUDO) {
      console.log("✓ OK (conteúdo bate)")
      ok++
    } else {
      console.log(`✗ FALHOU: conteúdo diverge\n  esperado: ${CONTEUDO}\n  recebido: ${body}`)
      fail++
    }
  } catch (e) {
    console.log(`✗ FALHOU: ${e.message}`)
    fail++
  }

  // 4. URL pública (só verifica formato — bucket pode não ter acesso público habilitado)
  const urlPublica = `${R2_PUBLIC_URL}/${CHAVE_TESTE}`
  console.log(`4. URL pública gerada: ${urlPublica}`)
  console.log("   (acesso público depende de configuração do bucket no Cloudflare)")
  ok++

  // 5. Delete (limpeza)
  process.stdout.write("5. Deletar arquivo teste... ")
  try {
    await r2.send(
      new DeleteObjectCommand({ Bucket: R2_BUCKET_NAME, Key: CHAVE_TESTE })
    )
    console.log("✓ OK")
    ok++
  } catch (e) {
    console.log(`✗ FALHOU: ${e.message}`)
    fail++
  }

  console.log(`\n=== RESULTADO: ${ok} ok, ${fail} falhou ===\n`)
  process.exit(fail > 0 ? 1 : 0)
}

testar()
