import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"

const taskSchema = z.object({
  clientId: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  assignedToId: z.string(),
  dueDate: z.string().datetime().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
})

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const assignedToId = searchParams.get("assignedToId")

    const where: any = {}
    if (status) where.status = status
    if (assignedToId) where.assignedToId = assignedToId
    else if (session.user.role !== "ADMIN") {
      where.assignedToId = session.user.id
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { dueDate: "asc" },
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error("Error fetching tasks:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const data = taskSchema.parse(body)

    const task = await prisma.task.create({
      data: {
        ...data,
        clientId: data.clientId || null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        createdById: session.user.id,
        priority: data.priority || "MEDIUM",
      },
      include: {
        client: true,
        assignedTo: true,
      },
    })

    // Create notification
    await prisma.notification.create({
      data: {
        userId: data.assignedToId,
        type: "TASK_ASSIGNED",
        title: "New Task Assigned",
        message: `You have been assigned a new task: ${task.title}`,
        link: `/dashboard/tasks/${task.id}`,
      },
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Error creating task:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

