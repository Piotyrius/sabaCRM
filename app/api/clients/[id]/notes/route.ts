import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { checkPermission, getPermissionContext } from "@/lib/permissions"
import { prisma } from "@/lib/db"
import { z } from "zod"

const noteSchema = z.object({
  content: z.string().min(1),
})

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
    const { content } = noteSchema.parse(body)

    const note = await prisma.clientNote.create({
      data: {
        clientId: params.id,
        content,
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
        action: "Added note to client",
      },
    })

    return NextResponse.json(note, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Error creating note:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

