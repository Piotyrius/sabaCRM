import { prisma } from "@/lib/db"

export async function detectDuplicates(clientData: {
  email?: string | null
  phone?: string | null
  name?: string
}): Promise<any[]> {
  const duplicates: any[] = []

  if (clientData.email) {
    const emailMatches = await prisma.client.findMany({
      where: {
        email: {
          equals: clientData.email,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
    })
    duplicates.push(...emailMatches)
  }

  if (clientData.phone) {
    const phoneMatches = await prisma.client.findMany({
      where: {
        phone: {
          equals: clientData.phone,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
    })
    duplicates.push(...phoneMatches)
  }

  // Remove duplicates from array
  const uniqueDuplicates = Array.from(
    new Map(duplicates.map((d) => [d.id, d])).values()
  )

  return uniqueDuplicates
}

export async function checkAndCreateDuplicateRecord(
  primaryClientId: string,
  duplicateClientId: string,
  confidence: number = 0.8
) {
  return await prisma.clientDuplicate.create({
    data: {
      primaryClientId,
      duplicateClientId,
      confidence,
    },
  })
}

export async function mergeClients(
  primaryClientId: string,
  duplicateClientId: string
) {
  // Get both clients
  const primary = await prisma.client.findUnique({
    where: { id: primaryClientId },
  })
  const duplicate = await prisma.client.findUnique({
    where: { id: duplicateClientId },
  })

  if (!primary || !duplicate) {
    throw new Error("Client not found")
  }

  // Merge data (prefer primary, but use duplicate if primary is null)
  const mergedData: any = {
    name: primary.name || duplicate.name,
    email: primary.email || duplicate.email,
    phone: primary.phone || duplicate.phone,
    country: primary.country || duplicate.country,
    affiliate: primary.affiliate || duplicate.affiliate,
    affiliateSource: primary.affiliateSource || duplicate.affiliateSource,
    balance: (primary.balance as any) + (duplicate.balance as any),
    note: [primary.note, duplicate.note]
      .filter(Boolean)
      .join("\n\n--- Merged ---\n\n"),
  }

  // Update primary client
  await prisma.client.update({
    where: { id: primaryClientId },
    data: mergedData,
  })

  // Move notes from duplicate to primary
  await prisma.clientNote.updateMany({
    where: { clientId: duplicateClientId },
    data: { clientId: primaryClientId },
  })

  // Move communications
  await prisma.clientCommunication.updateMany({
    where: { clientId: duplicateClientId },
    data: { clientId: primaryClientId },
  })

  // Delete duplicate
  await prisma.client.delete({
    where: { id: duplicateClientId },
  })

  // Mark duplicate record as resolved
  await prisma.clientDuplicate.updateMany({
    where: {
      OR: [
        { primaryClientId, duplicateClientId },
        { primaryClientId: duplicateClientId, duplicateClientId: primaryClientId },
      ],
    },
    data: {
      resolved: true,
      resolvedAt: new Date(),
    },
  })

  return { success: true }
}

