import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getFilteredClients, getPermissionContext } from "@/lib/permissions"
import { prisma } from "@/lib/db"
import { z } from "zod"
// SalesStatus is now a string

const filterSchema = z.object({
  status: z.string().optional(),
  country: z.string().optional(),
  salesRepId: z.string().optional(),
  retentionRepId: z.string().optional(),
  salesDeskId: z.string().optional(),
  retentionDeskId: z.string().optional(),
  affiliate: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  search: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const context = await getPermissionContext()
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const filters = filterSchema.parse(body)

    // Get base filtered clients based on permissions
    const { clients: allClients } = await getFilteredClients(context)
    let clients = allClients

    // Apply filters
    if (filters.status) {
      clients = clients.filter((c) => c.salesStatus === filters.status)
    }

    if (filters.country) {
      clients = clients.filter(
        (c) => c.country?.toLowerCase().includes(filters.country!.toLowerCase())
      )
    }

    if (filters.salesRepId) {
      clients = clients.filter((c) => c.salesRepId === filters.salesRepId)
    }

    if (filters.retentionRepId) {
      clients = clients.filter(
        (c) => c.retentionRepId === filters.retentionRepId
      )
    }

    if (filters.salesDeskId) {
      clients = clients.filter((c) => c.salesDeskId === filters.salesDeskId)
    }

    if (filters.retentionDeskId) {
      clients = clients.filter(
        (c) => c.retentionDeskId === filters.retentionDeskId
      )
    }

    if (filters.affiliate) {
      clients = clients.filter(
        (c) =>
          c.affiliate?.toLowerCase().includes(filters.affiliate!.toLowerCase())
      )
    }

    if (filters.dateFrom) {
      const dateFrom = new Date(filters.dateFrom)
      clients = clients.filter(
        (c) => new Date(c.registrationDate) >= dateFrom
      )
    }

    if (filters.dateTo) {
      const dateTo = new Date(filters.dateTo)
      clients = clients.filter((c) => new Date(c.registrationDate) <= dateTo)
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      clients = clients.filter(
        (c) =>
          c.name?.toLowerCase().includes(searchLower) ||
          c.email?.toLowerCase().includes(searchLower) ||
          c.phone?.includes(searchLower) ||
          c.clientId?.toLowerCase().includes(searchLower)
      )
    }

    return NextResponse.json({ clients })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid filter", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Error filtering clients:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

