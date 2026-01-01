import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { getFilteredClients, getPermissionContext } from "@/lib/permissions"
import * as XLSX from "xlsx"

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const context = await getPermissionContext()
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const report = await prisma.report.findUnique({
      where: { id: params.id },
    })

    if (!report || report.userId !== context.userId) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }

    // Get clients based on report config
    const { clients } = await getFilteredClients(context)

    // Prepare export data
    const exportData = clients.map((client) => ({
      "Client ID": client.clientId || "",
      "Name": client.name,
      "Email": client.email || "",
      "Phone": client.phone || "",
      "Country": client.country || "",
      "Status": client.salesStatus,
      "Balance": client.balance.toString(),
      "Registration Date": new Date(client.registrationDate).toISOString(),
    }))

    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report")
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${report.name}-${new Date().toISOString().split("T")[0]}.xlsx"`,
      },
    })
  } catch (error) {
    console.error("Error running report:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

