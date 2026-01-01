import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { resolved } = body

    const duplicate = await prisma.clientDuplicate.update({
      where: { id: params.id },
      data: {
        resolved: resolved ?? true,
        resolvedAt: resolved ? new Date() : null,
      },
    })

    return NextResponse.json(duplicate)
  } catch (error) {
    console.error("Error updating duplicate:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

