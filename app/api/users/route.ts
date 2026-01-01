import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"

const userUpdateSchema = z.object({
  officeId: z.string().nullable().optional(),
  departmentId: z.string().nullable().optional(),
  deskId: z.string().nullable().optional(),
  role: z.enum(["ADMIN", "EXECUTIVE", "TEAM_LEADER", "MANAGER"]).optional(),
})

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const deskId = searchParams.get("deskId")
    const departmentId = searchParams.get("departmentId")
    const officeId = searchParams.get("officeId")

    const where: any = {}

    // Filter by user's access if not admin
    if (session.user.role !== "ADMIN") {
      if (deskId && session.user.deskId === deskId) {
        where.deskId = deskId
      } else if (departmentId && session.user.departmentId === departmentId) {
        where.departmentId = departmentId
      } else if (officeId && session.user.officeId === officeId) {
        where.officeId = officeId
      } else {
        // Return only users in same hierarchy
        if (session.user.deskId) {
          where.deskId = session.user.deskId
        } else if (session.user.departmentId) {
          where.departmentId = session.user.departmentId
        } else if (session.user.officeId) {
          where.officeId = session.user.officeId
        } else {
          return NextResponse.json([])
        }
      }
    } else {
      // Admin can filter
      if (deskId) where.deskId = deskId
      if (departmentId) where.departmentId = departmentId
      if (officeId) where.officeId = officeId
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        office: {
          select: {
            id: true,
            name: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        desk: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error("Error fetching users:", error)
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
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { name, email, password, role, officeId, departmentId, deskId } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { email },
    })

    if (existing) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      )
    }

    // Hash password
    const bcrypt = require("bcryptjs")
    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || "EXECUTIVE",
        officeId: officeId || null,
        departmentId: departmentId || null,
        deskId: deskId || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        office: true,
        department: true,
        desk: true,
      },
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admin and managers can update user assignments
    if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { userId, ...updateData } = body

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      )
    }

    const validatedData = userUpdateSchema.parse(updateData)

    const user = await prisma.user.update({
      where: { id: userId },
      data: validatedData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        office: true,
        department: true,
        desk: true,
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Error updating user:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

