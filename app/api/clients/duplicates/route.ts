import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const duplicates = await prisma.clientDuplicate.findMany({
      where: {
        resolved: false,
      },
      include: {
        primaryClient: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        duplicateClient: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { confidence: "desc" },
    })

    return NextResponse.json(duplicates)
  } catch (error) {
    console.error("Error fetching duplicates:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

