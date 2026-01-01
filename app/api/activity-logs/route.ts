import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")
    const skip = (page - 1) * limit
    const userId = searchParams.get("userId")
    const clientId = searchParams.get("clientId")
    const type = searchParams.get("type")

    const where: any = {}

    // Filter by permissions
    if (session.user.role !== "ADMIN") {
      if (session.user.role === "EXECUTIVE") {
        where.userId = session.user.id
      } else if (session.user.role === "TEAM_LEADER" && session.user.deskId) {
        // Get users in same desk
        const deskUsers = await prisma.user.findMany({
          where: { deskId: session.user.deskId },
          select: { id: true },
        })
        where.userId = { in: deskUsers.map((u) => u.id) }
      } else if (session.user.role === "MANAGER") {
        // Manager can see department/office logs
        if (session.user.departmentId) {
          const deptUsers = await prisma.user.findMany({
            where: { departmentId: session.user.departmentId },
            select: { id: true },
          })
          where.userId = { in: deptUsers.map((u) => u.id) }
        } else if (session.user.officeId) {
          const officeUsers = await prisma.user.findMany({
            where: { officeId: session.user.officeId },
            select: { id: true },
          })
          where.userId = { in: officeUsers.map((u) => u.id) }
        }
      }
    }

    if (userId) where.userId = userId
    if (clientId) where.clientId = clientId
    if (type) where.type = type

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          client: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.activityLog.count({ where }),
    ])

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching activity logs:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

