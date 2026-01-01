import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { validateSquaretalkWebhook } from "@/lib/squaretalk"

// Placeholder webhook handler for Squaretalk
// This will process call events from Squaretalk

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const signature = request.headers.get("x-squaretalk-signature") || ""

    // Validate webhook signature
    const secret = process.env.SQUARETALK_WEBHOOK_SECRET || ""
    if (!validateSquaretalkWebhook(body, signature, secret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    const { event, data } = body

    // Handle different event types
    switch (event) {
      case "call.completed":
        // Associate call with client if phone number matches
        if (data.phoneNumber) {
          const client = await prisma.client.findFirst({
            where: {
              phone: data.phoneNumber,
            },
          })

          if (client) {
            // Create communication record
            await prisma.clientCommunication.create({
              data: {
                clientId: client.id,
                type: "CALL",
                direction: data.direction || "INBOUND",
                metadata: {
                  callId: data.callId,
                  duration: data.duration,
                  status: data.status,
                },
              },
            })

            // Update client status if needed
            if (data.status === "no-answer") {
              await prisma.client.update({
                where: { id: client.id },
                data: { salesStatus: "NO_ANSWER" },
              })
            }
          }
        }
        break

      case "call.started":
        // Handle call started event
        break

      default:
        console.log("Unhandled Squaretalk event:", event)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error processing Squaretalk webhook:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

