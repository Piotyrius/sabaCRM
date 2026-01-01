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
    const { enabled } = body

    const schedule = await prisma.reportSchedule.findUnique({
      where: { id: params.id },
      include: { report: true },
    })

    if (!schedule || schedule.report.userId !== session.user.id) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 })
    }

    const updated = await prisma.reportSchedule.update({
      where: { id: params.id },
      data: {
        enabled: enabled ?? true,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating schedule:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

