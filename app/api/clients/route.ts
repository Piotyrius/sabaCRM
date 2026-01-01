import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getFilteredClients, getPermissionContext } from "@/lib/permissions"
import { prisma } from "@/lib/db"
import { z } from "zod"
// SalesStatus is now a string
import { detectDuplicates } from "@/lib/duplicate"

const clientSchema = z.object({
  clientId: z.string().optional().nullable(),
  name: z.string().min(1),
  country: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  affiliate: z.string().optional().nullable(),
  affiliateSource: z.string().optional().nullable(),
  salesStatus: z.string().optional(),
  salesDeskId: z.string().optional().nullable(),
  salesRepId: z.string().optional().nullable(),
  retentionDeskId: z.string().optional().nullable(),
  retentionRepId: z.string().optional().nullable(),
  ftdDate: z.string().datetime().optional().nullable(),
  balance: z.number().optional(),
  note: z.string().optional().nullable(),
})

export async function GET(request: Request) {
  try {
    const context = await getPermissionContext()
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")
    const skip = (page - 1) * limit

    const { clients, total } = await getFilteredClients(context, { skip, take: limit })

    return NextResponse.json({
      clients,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching clients:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const context = await getPermissionContext()
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const data = clientSchema.parse(body)

    // Check for duplicates
    const duplicates = await detectDuplicates({
      email: data.email,
      phone: data.phone,
      name: data.name,
    })

    const client = await prisma.client.create({
      data: {
        ...data,
        clientId: data.clientId || undefined,
        ftdDate: data.ftdDate ? new Date(data.ftdDate) : undefined,
        balance: data.balance ? data.balance : 0,
        createdById: context.userId,
      },
      include: {
        salesDesk: {
          include: {
            department: {
              include: {
                office: true,
              },
            },
          },
        },
        retentionDesk: {
          include: {
            department: {
              include: {
                office: true,
              },
            },
          },
        },
        salesRep: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        retentionRep: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: context.userId,
        clientId: client.id,
        type: "CREATE",
        entityType: "CLIENT",
        entityId: client.id,
        action: `Created client: ${client.name}`,
        changes: {
          created: {
            name: client.name,
            email: client.email,
            phone: client.phone,
          },
        },
      },
    })

    // Create duplicate records if found
    if (duplicates.length > 0) {
      for (const duplicate of duplicates) {
        await prisma.clientDuplicate.create({
          data: {
            primaryClientId: duplicate.id,
            duplicateClientId: client.id,
            confidence: 0.8,
          },
        })
      }
    }

    return NextResponse.json(
      {
        client,
        duplicates: duplicates.length > 0 ? duplicates : undefined,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Error creating client:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

