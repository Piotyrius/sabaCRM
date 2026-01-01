import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { checkPermission, getPermissionContext } from "@/lib/permissions"
import { prisma } from "@/lib/db"
import { z } from "zod"
// SalesStatus is now a string

const clientUpdateSchema = z.object({
  clientId: z.string().optional().nullable(),
  name: z.string().min(1).optional(),
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

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const context = await getPermissionContext()
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const hasPermission = await checkPermission(
      context,
      "client",
      params.id,
      "read"
    )

    if (!hasPermission) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const client = await prisma.client.findUnique({
      where: { id: params.id },
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
        notes: {
          orderBy: { createdAt: "desc" },
        },
        statusHistory: {
          include: {
            changedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        communications: {
          orderBy: { createdAt: "desc" },
          take: 50,
        },
      },
    })

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    return NextResponse.json(client)
  } catch (error) {
    console.error("Error fetching client:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const context = await getPermissionContext()
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const hasPermission = await checkPermission(
      context,
      "client",
      params.id,
      "write"
    )

    if (!hasPermission) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get current client to track changes
    const currentClient = await prisma.client.findUnique({
      where: { id: params.id },
    })

    if (!currentClient) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    const body = await request.json()
    const data = clientUpdateSchema.parse(body)

    // Track status change
    let statusChanged = false
    if (data.salesStatus && data.salesStatus !== currentClient.salesStatus) {
      statusChanged = true
    }

    const updateData: any = { ...data }
    if (data.ftdDate) {
      updateData.ftdDate = new Date(data.ftdDate)
    }

    const client = await prisma.client.update({
      where: { id: params.id },
      data: updateData,
      include: {
        salesDesk: true,
        retentionDesk: true,
        salesRep: true,
        retentionRep: true,
      },
    })

    // Log status change
    if (statusChanged) {
      await prisma.clientStatusHistory.create({
        data: {
          clientId: client.id,
          oldStatus: currentClient.salesStatus,
          newStatus: client.salesStatus,
          changedById: context.userId,
        },
      })
    }

    // Log activity
    const changes: any = {}
    Object.keys(data).forEach((key) => {
      if (data[key as keyof typeof data] !== undefined) {
        changes[key] = {
          from: currentClient[key as keyof typeof currentClient],
          to: data[key as keyof typeof data],
        }
      }
    })

    await prisma.activityLog.create({
      data: {
        userId: context.userId,
        clientId: client.id,
        type: "UPDATE",
        entityType: "CLIENT",
        entityId: client.id,
        action: `Updated client: ${client.name}`,
        changes,
      },
    })

    return NextResponse.json(client)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Error updating client:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const context = await getPermissionContext()
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const hasPermission = await checkPermission(
      context,
      "client",
      params.id,
      "delete"
    )

    if (!hasPermission) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const client = await prisma.client.delete({
      where: { id: params.id },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: context.userId,
        type: "DELETE",
        entityType: "CLIENT",
        entityId: params.id,
        action: `Deleted client: ${client.name}`,
      },
    })

    return NextResponse.json({ message: "Client deleted successfully" })
  } catch (error) {
    console.error("Error deleting client:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

