import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"

const departmentSchema = z.object({
  name: z.string().min(1),
  officeId: z.string(),
})

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const officeId = searchParams.get("officeId")

    const where: any = {}
    if (officeId) {
      where.officeId = officeId
    }

    // Filter by user's access if not admin
    if (session.user.role !== "ADMIN") {
      if (session.user.officeId) {
        where.officeId = session.user.officeId
      } else {
        return NextResponse.json([])
      }
    }

    const departments = await prisma.department.findMany({
      where,
      include: {
        office: true,
        desks: true,
        _count: {
          select: {
            users: true,
          },
        },
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json(departments)
  } catch (error) {
    console.error("Error fetching departments:", error)
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
    const { name, officeId } = departmentSchema.parse(body)

    const department = await prisma.department.create({
      data: { name, officeId },
      include: {
        office: true,
      },
    })

    return NextResponse.json(department, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Error creating department:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

