import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getFilteredClients, getPermissionContext } from "@/lib/permissions"
import Fuse from "fuse.js"

export async function GET(request: Request) {
  try {
    const context = await getPermissionContext()
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") || ""
    const limit = parseInt(searchParams.get("limit") || "10")

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] })
    }

    // Get all accessible clients
    const clients = await getFilteredClients(context)

    // Configure Fuse.js for fuzzy search
    const fuse = new Fuse(clients, {
      keys: [
        { name: "name", weight: 0.5 },
        { name: "email", weight: 0.3 },
        { name: "phone", weight: 0.2 },
        { name: "clientId", weight: 0.2 },
      ],
      threshold: 0.3,
      includeScore: true,
    })

    const results = fuse
      .search(query)
      .slice(0, limit)
      .map((result) => ({
        ...result.item,
        score: result.score,
      }))

    return NextResponse.json({ results })
  } catch (error) {
    console.error("Error searching clients:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

