import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { checkPermission, getPermissionContext } from "@/lib/permissions"

const communicationSchema = z.object({
  type: z.string().min(1),
  direction: z.string().optional(),
  subject: z.string().optional(),
  content: z.string().optional(),
  metadata: z.any().optional(),
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

    const communications = await prisma.clientCommunication.findMany({
      where: { clientId: params.id },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(communications)
  } catch (error) {
    console.error("Error fetching communications:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(
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

    const body = await request.json()
    const data = communicationSchema.parse(body)

    const communication = await prisma.clientCommunication.create({
      data: {
        clientId: params.id,
        type: data.type,
        direction: data.direction || null,
        subject: data.subject || null,
        content: data.content || null,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: context.userId,
        clientId: params.id,
        type: "NOTE_ADDED",
        entityType: "CLIENT",
        entityId: params.id,
        action: `Added ${data.type} communication`,
      },
    })

    return NextResponse.json(communication, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Error creating communication:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
