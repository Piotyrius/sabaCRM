import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export type PermissionContext = {
  userId: string
  role: string
  officeId?: string | null
  departmentId?: string | null
  deskId?: string | null
}

/**
 * Check if user has permission to access a resource
 */
export async function checkPermission(
  context: PermissionContext,
  resourceType: "client" | "user" | "office" | "department" | "desk",
  resourceId?: string,
  action: "read" | "write" | "delete" = "read"
): Promise<boolean> {
  const { userId, role, officeId, departmentId, deskId } = context

  // Admin has full access
  if (role === "ADMIN") {
    return true
  }

  // For client resources
  if (resourceType === "client" && resourceId) {
    const client = await prisma.client.findUnique({
      where: { id: resourceId },
      select: {
        salesRepId: true,
        retentionRepId: true,
        salesDeskId: true,
        retentionDeskId: true,
        salesDesk: {
          select: {
            departmentId: true,
            department: {
              select: {
                officeId: true,
              },
            },
          },
        },
        retentionDesk: {
          select: {
            departmentId: true,
            department: {
              select: {
                officeId: true,
              },
            },
          },
        },
      },
    })

    if (!client) return false

    // Executive: only own clients
    if (role === "EXECUTIVE") {
      return (
        client.salesRepId === userId || client.retentionRepId === userId
      )
    }

    // Team Leader: team members' clients
    if (role === "TEAM_LEADER" && deskId) {
      // Get all users in the same desk
      const deskUsers = await prisma.user.findMany({
        where: { deskId },
        select: { id: true },
      })
      const deskUserIds = deskUsers.map((u) => u.id)
      return (
        deskUserIds.includes(client.salesRepId || "") ||
        deskUserIds.includes(client.retentionRepId || "")
      )
    }

    // Manager: desk/department clients
    if (role === "MANAGER") {
      if (deskId) {
        return (
          client.salesDeskId === deskId ||
          client.retentionDeskId === deskId
        )
      }
      if (departmentId) {
        return (
          client.salesDesk?.departmentId === departmentId ||
          client.retentionDesk?.departmentId === departmentId
        )
      }
      if (officeId) {
        return (
          client.salesDesk?.department?.officeId === officeId ||
          client.retentionDesk?.department?.officeId === officeId
        )
      }
    }
  }

  // For user resources
  if (resourceType === "user" && resourceId) {
    const targetUser = await prisma.user.findUnique({
      where: { id: resourceId },
      select: {
        officeId: true,
        departmentId: true,
        deskId: true,
      },
    })

    if (!targetUser) return false

    // Executive: only self
    if (role === "EXECUTIVE") {
      return resourceId === userId
    }

    // Team Leader: same desk users
    if (role === "TEAM_LEADER" && deskId) {
      return targetUser.deskId === deskId
    }

    // Manager: same department/office users
    if (role === "MANAGER") {
      if (departmentId) {
        return targetUser.departmentId === departmentId
      }
      if (officeId) {
        // Check if target user's office matches
        const targetOffice = await prisma.user.findUnique({
          where: { id: resourceId },
          select: {
            office: {
              select: { id: true },
            },
          },
        })
        return targetOffice?.office?.id === officeId
      }
    }
  }

  return false
}

/**
 * Get filtered clients based on user permissions
 * Returns both clients and total count for efficient pagination
 */
export async function getFilteredClients(
  context: PermissionContext,
  options?: { skip?: number; take?: number }
) {
  const { userId, role, officeId, departmentId, deskId } = context
  const skip = options?.skip
  const take = options?.take

  let where: any = {}

  if (role === "ADMIN") {
    // Admin sees all
    where = {}
  } else if (role === "EXECUTIVE") {
    where = {
      OR: [
        { salesRepId: userId },
        { retentionRepId: userId },
      ],
    }
  } else if (role === "TEAM_LEADER" && deskId) {
    // Get all users in the desk
    const deskUsers = await prisma.user.findMany({
      where: { deskId },
      select: { id: true },
    })
    const deskUserIds = deskUsers.map((u) => u.id)

    where = {
      OR: [
        { salesRepId: { in: deskUserIds } },
        { retentionRepId: { in: deskUserIds } },
      ],
    }
  } else if (role === "MANAGER") {
    if (deskId) {
      where.OR = [
        { salesDeskId: deskId },
        { retentionDeskId: deskId },
      ]
    } else if (departmentId) {
      // Get all desks in the department
      const desks = await prisma.desk.findMany({
        where: { departmentId },
        select: { id: true },
      })
      const deskIds = desks.map((d) => d.id)

      where.OR = [
        { salesDeskId: { in: deskIds } },
        { retentionDeskId: { in: deskIds } },
      ]
    } else if (officeId) {
      // Get all departments in the office
      const departments = await prisma.department.findMany({
        where: { officeId },
        select: { id: true },
      })
      const deptIds = departments.map((d) => d.id)

      // Get all desks in those departments
      const desks = await prisma.desk.findMany({
        where: { departmentId: { in: deptIds } },
        select: { id: true },
      })
      const deskIds = desks.map((d) => d.id)

      where.OR = [
        { salesDeskId: { in: deskIds } },
        { retentionDeskId: { in: deskIds } },
      ]
    }
  } else {
    return { clients: [], total: 0 }
  }

  // Use efficient pagination at database level
  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      select: {
        id: true,
        clientId: true,
        name: true,
        email: true,
        phone: true,
        country: true,
        salesStatus: true,
        balance: true,
        registrationDate: true,
        salesRep: {
          select: {
            name: true,
          },
        },
        retentionRep: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.client.count({ where }),
  ])

  return { clients, total }
}

/**
 * Get permission context from session
 */
export async function getPermissionContext(): Promise<PermissionContext | null> {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    return null
  }

  return {
    userId: session.user.id,
    role: session.user.role,
    officeId: session.user.officeId,
    departmentId: session.user.departmentId,
    deskId: session.user.deskId,
  }
}

