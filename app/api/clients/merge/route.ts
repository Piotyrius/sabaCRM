import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getPermissionContext } from "@/lib/permissions"
import { mergeClients } from "@/lib/duplicate"
import { prisma } from "@/lib/db"
import { z } from "zod"

const mergeSchema = z.object({
  primaryClientId: z.string(),
  duplicateClientId: z.string(),
})

export async function POST(request: Request) {
  try {
    const context = await getPermissionContext()
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { primaryClientId, duplicateClientId } = mergeSchema.parse(body)

    const result = await mergeClients(primaryClientId, duplicateClientId)

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: context.userId,
        type: "UPDATE",
        entityType: "CLIENT",
        entityId: primaryClientId,
        action: `Merged duplicate client ${duplicateClientId}`,
      },
    })

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Error merging clients:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}

