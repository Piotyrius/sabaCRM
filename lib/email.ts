import nodemailer from "nodemailer"
import { prisma } from "@/lib/db"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

export async function sendEmail(
  to: string,
  subject: string,
  body: string,
  userId?: string,
  templateId?: string
) {
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html: body,
    })

    // Log email
    await prisma.emailLog.create({
      data: {
        userId,
        to,
        subject,
        body,
        templateId,
        sent: true,
        sentAt: new Date(),
      },
    })

    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("Error sending email:", error)

    // Log failed email
    await prisma.emailLog.create({
      data: {
        userId,
        to,
        subject,
        body,
        templateId,
        sent: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
    })

    return { success: false, error }
  }
}

export async function getEmailTemplate(name: string) {
  return await prisma.emailTemplate.findUnique({
    where: { name },
  })
}

