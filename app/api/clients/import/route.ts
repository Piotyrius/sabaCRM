import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getPermissionContext } from "@/lib/permissions"
import { prisma } from "@/lib/db"
import * as XLSX from "xlsx"
// SalesStatus is now a string

export async function POST(request: Request) {
  try {
    const context = await getPermissionContext()
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const workbook = XLSX.read(buffer, { type: "buffer" })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(worksheet)

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    }

    for (let i = 0; i < data.length; i++) {
      const row = data[i] as any
      try {
        // Map CSV/Excel columns to client fields
        const clientData: any = {
          clientId: row["Client ID"] || row["clientId"] || null,
          name: row["Name"] || row["name"],
          email: row["Email"] || row["email"] || null,
          phone: row["Phone"] || row["phone"] || null,
          country: row["Country"] || row["country"] || null,
          affiliate: row["Affiliate"] || row["affiliate"] || null,
          affiliateSource:
            row["Affiliate Source"] || row["affiliateSource"] || null,
          salesStatus:
            (row["Sales Status"] || row["salesStatus"] || "INITIAL_CALL")
              .toUpperCase()
              .replace(/\s/g, "_"),
          ftdDate: row["FTD Date"] || row["ftdDate"] || null,
          balance: parseFloat(row["Balance"] || row["balance"] || "0") || 0,
          note: row["Note"] || row["note"] || null,
          createdById: context.userId,
        }

        // Validate required fields
        if (!clientData.name) {
          throw new Error("Name is required")
        }

        // Handle date parsing
        if (clientData.ftdDate) {
          clientData.ftdDate = new Date(clientData.ftdDate)
        }

        // Get desk and rep IDs from names if provided
        if (row["Sales Desk"] || row["salesDesk"]) {
          const deskName = row["Sales Desk"] || row["salesDesk"]
          const desk = await prisma.desk.findFirst({
            where: { name: { contains: deskName, mode: "insensitive" } },
          })
          if (desk) clientData.salesDeskId = desk.id
        }

        if (row["Sales Rep"] || row["salesRep"]) {
          const repName = row["Sales Rep"] || row["salesRep"]
          const rep = await prisma.user.findFirst({
            where: {
              OR: [
                { name: { contains: repName, mode: "insensitive" } },
                { email: { contains: repName, mode: "insensitive" } },
              ],
            },
          })
          if (rep) clientData.salesRepId = rep.id
        }

        await prisma.client.create({ data: clientData })
        results.success++

        // Log activity
        await prisma.activityLog.create({
          data: {
            userId: context.userId,
            type: "CREATE",
            entityType: "CLIENT",
            action: `Imported client: ${clientData.name}`,
            metadata: { source: "import" },
          },
        })
      } catch (error: any) {
        results.failed++
        results.errors.push(
          `Row ${i + 2}: ${error.message || "Unknown error"}`
        )
      }
    }

    return NextResponse.json({
      message: `Import completed: ${results.success} successful, ${results.failed} failed`,
      results,
    })
  } catch (error) {
    console.error("Error importing clients:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

