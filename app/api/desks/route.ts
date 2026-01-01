import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"

const deskSchema = z.object({
  name: z.string().min(1),
  departmentId: z.string(),
})

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const departmentId = searchParams.get("departmentId")

    const where: any = {}
    if (departmentId) {
      where.departmentId = departmentId
    }

    // Filter by user's access if not admin
    if (session.user.role !== "ADMIN") {
      if (session.user.departmentId) {
        where.departmentId = session.user.departmentId
      } else if (session.user.deskId) {
        where.id = session.user.deskId
      } else {
        return NextResponse.json([])
      }
    }

    const desks = await prisma.desk.findMany({
      where,
      include: {
        department: {
          include: {
            office: true,
          },
        },
        _count: {
          select: {
            users: true,
          },
        },
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json(desks)
  } catch (error) {
    console.error("Error fetching desks:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, departmentId } = deskSchema.parse(body)

    const desk = await prisma.desk.create({
      data: { name, departmentId },
      include: {
        department: {
          include: {
            office: true,
          },
        },
      },
    })

    return NextResponse.json(desk, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Error creating desk:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

