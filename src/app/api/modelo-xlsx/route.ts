import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import * as XLSX from "xlsx"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 })

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet([
    ["ID", "TAREFA", "LOCAL", "QUANTIDADE", "UNIDADE", "DATA INICIO", "DATA FIM"],
    ["001", "Exemplo de tarefa", "Setor A", 10, "m²", "01/01/2025", "31/01/2025"],
  ])

  ws["!cols"] = [
    { wch: 8 },
    { wch: 40 },
    { wch: 20 },
    { wch: 12 },
    { wch: 10 },
    { wch: 14 },
    { wch: 14 },
  ]

  XLSX.utils.book_append_sheet(wb, ws, "Cronograma")
  const xlsxBuffer = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer

  return new NextResponse(xlsxBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="modelo-cronograma.xlsx"',
    },
  })
}
