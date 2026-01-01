import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getFilteredClients, getPermissionContext } from "@/lib/permissions"
import * as XLSX from "xlsx"

export async function GET(request: Request) {
  try {
    const context = await getPermissionContext()
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get("format") || "csv"

    const { clients } = await getFilteredClients(context)

    // Prepare data for export
    const exportData = clients.map((client) => ({
      "Client ID": client.clientId || "",
      "Name": client.name,
      "Email": client.email || "",
      "Phone": client.phone || "",
      "Country": client.country || "",
      "Affiliate": client.affiliate || "",
      "Affiliate Source": client.affiliateSource || "",
      "Sales Status": client.salesStatus,
      "Sales Desk": "",
      "Sales Rep": "",
      "Retention Desk": "",
      "Retention Rep": "",
      "FTD Date": client.ftdDate ? new Date(client.ftdDate).toISOString() : "",
      "Balance": client.balance.toString(),
      "Registration Date": new Date(client.registrationDate).toISOString(),
      "Note": client.note || "",
    }))

    if (format === "xlsx") {
      const worksheet = XLSX.utils.json_to_sheet(exportData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Clients")
      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })

      return new NextResponse(buffer, {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="clients-${new Date().toISOString().split("T")[0]}.xlsx"`,
        },
      })
    } else {
      // CSV format
      const headers = Object.keys(exportData[0] || {})
      const csvRows = [
        headers.join(","),
        ...exportData.map((row) =>
          headers
            .map((header) => {
              const value = row[header as keyof typeof row]
              return typeof value === "string" && value.includes(",")
                ? `"${value.replace(/"/g, '""')}"`
                : value
            })
            .join(",")
        ),
      ]

      const csv = csvRows.join("\n")

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="clients-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      })
    }
  } catch (error) {
    console.error("Error exporting clients:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

