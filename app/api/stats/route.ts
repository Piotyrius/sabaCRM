import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getFilteredClients, getPermissionContext } from "@/lib/permissions"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    const context = await getPermissionContext()
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get only what we need for stats - much faster (no pagination needed)
    const { clients } = await getFilteredClients(context)

    // Calculate stats efficiently
    const totalClients = clients.length
    const convertedClients = clients.filter(
      (c) => c.salesStatus === "CONVERTED"
    ).length
    const totalBalance = clients.reduce(
      (sum, c) => sum + (parseFloat(c.balance.toString()) || 0),
      0
    )

    // Status distribution
    const statusCounts: Record<string, number> = {}
    clients.forEach((c) => {
      statusCounts[c.salesStatus] = (statusCounts[c.salesStatus] || 0) + 1
    })
    const statusDistribution = Object.entries(statusCounts).map(
      ([name, value]) => ({
        name: name.replace(/_/g, " "),
        value,
      })
    )

    return NextResponse.json({
      totalClients,
      convertedClients,
      totalBalance,
      conversionRate:
        totalClients > 0
          ? ((convertedClients / totalClients) * 100).toFixed(1)
          : "0",
      statusDistribution,
    })
  } catch (error) {
    console.error("Error fetching stats:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

