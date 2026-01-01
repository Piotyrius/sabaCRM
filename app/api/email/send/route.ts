import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { sendEmail, getEmailTemplate } from "@/lib/email"
import { z } from "zod"

const sendEmailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  body: z.string().optional(),
  templateName: z.string().optional(),
  templateVariables: z.record(z.any()).optional(),
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { to, subject, body, templateName, templateVariables } =
      sendEmailSchema.parse(body)

    let emailBody = body || ""

    // Use template if provided
    if (templateName) {
      const template = await getEmailTemplate(templateName)
      if (template) {
        emailBody = template.body
        // Replace template variables
        if (templateVariables) {
          Object.entries(templateVariables).forEach(([key, value]) => {
            emailBody = emailBody.replace(
              new RegExp(`{{${key}}}`, "g"),
              String(value)
            )
          })
        }
      }
    }

    const result = await sendEmail(
      to,
      subject,
      emailBody,
      session.user.id,
      templateName ? (await getEmailTemplate(templateName))?.id : undefined
    )

    if (result.success) {
      return NextResponse.json({ success: true, messageId: result.messageId })
    } else {
      return NextResponse.json(
        { error: "Failed to send email", details: result.error },
        { status: 500 }
      )
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Error sending email:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

