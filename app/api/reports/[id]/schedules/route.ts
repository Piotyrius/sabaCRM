import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"

const scheduleSchema = z.object({
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY"]),
  dayOfWeek: z.number().min(0).max(6).optional().nullable(),
  dayOfMonth: z.number().min(1).max(31).optional().nullable(),
  time: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
  enabled: z.boolean().optional(),
})

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const schedules = await prisma.reportSchedule.findMany({
      where: {
        reportId: params.id,
        report: {
          userId: session.user.id,
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(schedules)
  } catch (error) {
    console.error("Error fetching schedules:", error)
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
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify report ownership
    const report = await prisma.report.findUnique({
      where: { id: params.id },
    })

    if (!report || report.userId !== session.user.id) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }

    const body = await request.json()
    const data = scheduleSchema.parse(body)

    // Calculate next run time
    const now = new Date()
    let nextRunAt = new Date()
    const [hours, minutes] = data.time.split(":").map(Number)
    nextRunAt.setHours(hours, minutes, 0, 0)

    if (data.frequency === "DAILY") {
      if (nextRunAt <= now) {
        nextRunAt.setDate(nextRunAt.getDate() + 1)
      }
    } else if (data.frequency === "WEEKLY" && data.dayOfWeek !== null) {
      const daysUntil = (data.dayOfWeek - now.getDay() + 7) % 7
      nextRunAt.setDate(now.getDate() + (daysUntil || 7))
    } else if (data.frequency === "MONTHLY" && data.dayOfMonth !== null) {
      nextRunAt.setDate(data.dayOfMonth)
      if (nextRunAt <= now) {
        nextRunAt.setMonth(nextRunAt.getMonth() + 1)
      }
    }

    const schedule = await prisma.reportSchedule.create({
      data: {
        reportId: params.id,
        frequency: data.frequency,
        dayOfWeek: data.dayOfWeek,
        dayOfMonth: data.dayOfMonth,
        time: data.time,
        enabled: data.enabled ?? true,
        nextRunAt,
      },
    })

    return NextResponse.json(schedule, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Error creating schedule:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

