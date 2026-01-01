import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { z } from "zod"

// API Key authentication middleware
async function authenticateApiKey(request: Request): Promise<string | null> {
  const apiKey = request.headers.get("x-api-key")
  if (!apiKey) return null

  const key = await prisma.apiKey.findUnique({
    where: { key: apiKey },
    include: { user: true },
  })

  if (!key || !key.active) return null
  if (key.expiresAt && key.expiresAt < new Date()) return null

  // Update last used
  await prisma.apiKey.update({
    where: { id: key.id },
    data: { lastUsedAt: new Date() },
  })

  return key.userId
}

// Rate limiting (simple in-memory, should use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(apiKey: string): boolean {
  const now = Date.now()
  const limit = rateLimitMap.get(apiKey)

  if (!limit || now > limit.resetAt) {
    rateLimitMap.set(apiKey, { count: 1, resetAt: now + 60000 }) // 1 minute window
    return true
  }

  if (limit.count >= 100) {
    // 100 requests per minute
    return false
  }

  limit.count++
  return true
}

export async function GET(request: Request) {
  try {
    const apiKey = request.headers.get("x-api-key")
    if (!apiKey) {
      return NextResponse.json({ error: "API key required" }, { status: 401 })
    }

    if (!checkRateLimit(apiKey)) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      )
    }

    const userId = await authenticateApiKey(request)
    if (!userId) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100)
    const skip = (page - 1) * limit

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
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
        },
      }),
      prisma.client.count(),
    ])

    // Log API access
    await prisma.apiLog.create({
      data: {
        apiKeyId: (await prisma.apiKey.findUnique({ where: { key: apiKey } }))
          ?.id,
        endpoint: "/api/v1/clients",
        method: "GET",
        statusCode: 200,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      },
    })

    return NextResponse.json({
      data: clients,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const apiKey = request.headers.get("x-api-key")
    if (!apiKey) {
      return NextResponse.json({ error: "API key required" }, { status: 401 })
    }

    if (!checkRateLimit(apiKey)) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      )
    }

    const userId = await authenticateApiKey(request)
    if (!userId) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
    }

    const body = await request.json()
    const client = await prisma.client.create({
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone,
        country: body.country,
        createdById: userId,
      },
    })

    // Log API access
    await prisma.apiLog.create({
      data: {
        apiKeyId: (await prisma.apiKey.findUnique({ where: { key: apiKey } }))
          ?.id,
        endpoint: "/api/v1/clients",
        method: "POST",
        statusCode: 201,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      },
    })

    return NextResponse.json({ data: client }, { status: 201 })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

