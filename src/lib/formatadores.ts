export function formatarBytes(bytes: number, decimais = 1): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 GB"

  const mb = bytes / (1024 * 1024)
  if (mb < 1024) return `${mb.toFixed(decimais)} MB`

  const gb = mb / 1024
  return `${gb.toFixed(decimais)} GB`
}
