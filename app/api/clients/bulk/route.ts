import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { checkPermission, getPermissionContext } from "@/lib/permissions"
import { prisma } from "@/lib/db"
import { z } from "zod"
// SalesStatus is now a string

const bulkUpdateSchema = z.object({
  clientIds: z.array(z.string()),
  updates: z.object({
    salesStatus: z.string().optional(),
    salesRepId: z.string().optional().nullable(),
    retentionRepId: z.string().optional().nullable(),
    salesDeskId: z.string().optional().nullable(),
    retentionDeskId: z.string().optional().nullable(),
  }),
})

export async function POST(request: Request) {
  try {
    const context = await getPermissionContext()
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { clientIds, updates } = bulkUpdateSchema.parse(body)

    // Check permissions for all clients
    for (const clientId of clientIds) {
      const hasPermission = await checkPermission(
        context,
        "client",
        clientId,
        "write"
      )
      if (!hasPermission) {
        return NextResponse.json(
          { error: `No permission to update client ${clientId}` },
          { status: 403 }
        )
      }
    }

    // Perform bulk update
    const updateData: any = {}
    if (updates.salesStatus) updateData.salesStatus = updates.salesStatus
    if (updates.salesRepId !== undefined)
      updateData.salesRepId = updates.salesRepId
    if (updates.retentionRepId !== undefined)
      updateData.retentionRepId = updates.retentionRepId
    if (updates.salesDeskId !== undefined)
      updateData.salesDeskId = updates.salesDeskId
    if (updates.retentionDeskId !== undefined)
      updateData.retentionDeskId = updates.retentionDeskId

    const result = await prisma.client.updateMany({
      where: {
        id: { in: clientIds },
      },
      data: updateData,
    })

    // Log activity for each client
    for (const clientId of clientIds) {
      await prisma.activityLog.create({
        data: {
          userId: context.userId,
          clientId,
          type: "UPDATE",
          entityType: "CLIENT",
          entityId: clientId,
          action: "Bulk update performed",
          changes: updates,
        },
      })
    }

    return NextResponse.json({
      message: `Updated ${result.count} clients`,
      count: result.count,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Error performing bulk update:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const context = await getPermissionContext()
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { clientIds } = z.object({ clientIds: z.array(z.string()) }).parse(body)

    // Check permissions for all clients
    for (const clientId of clientIds) {
      const hasPermission = await checkPermission(
        context,
        "client",
        clientId,
        "delete"
      )
      if (!hasPermission) {
        return NextResponse.json(
          { error: `No permission to delete client ${clientId}` },
          { status: 403 }
        )
      }
    }

    const result = await prisma.client.deleteMany({
      where: {
        id: { in: clientIds },
      },
    })

    // Log activity
    for (const clientId of clientIds) {
      await prisma.activityLog.create({
        data: {
          userId: context.userId,
          type: "DELETE",
          entityType: "CLIENT",
          entityId: clientId,
          action: "Bulk delete performed",
        },
      })
    }

    return NextResponse.json({
      message: `Deleted ${result.count} clients`,
      count: result.count,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Error performing bulk delete:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

