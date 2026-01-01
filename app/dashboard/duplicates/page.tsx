"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Duplicate {
  id: string
  primaryClient: {
    id: string
    name: string
    email: string | null
    phone: string | null
  }
  duplicateClient: {
    id: string
    name: string
    email: string | null
    phone: string | null
  }
  confidence: number
  detectedAt: string
  resolved: boolean
}

export default function DuplicatesPage() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [merging, setMerging] = useState<string | null>(null)

  const { data: duplicates = [], isLoading } = useQuery({
    queryKey: ["duplicates"],
    queryFn: async () => {
      const response = await fetch("/api/clients/duplicates")
      if (!response.ok) throw new Error("Failed to fetch duplicates")
      return response.json()
    },
    enabled: !!session,
  })

  const handleMerge = async (primaryId: string, duplicateId: string) => {
    if (
      !confirm(
        "Are you sure you want to merge these clients? This action cannot be undone."
      )
    )
      return

    setMerging(`${primaryId}-${duplicateId}`)
    try {
      const response = await fetch("/api/clients/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primaryClientId: primaryId,
          duplicateClientId: duplicateId,
        }),
      })
      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ["duplicates"] })
        queryClient.invalidateQueries({ queryKey: ["clients"] })
        alert("Clients merged successfully!")
      } else {
        alert("Failed to merge clients")
      }
    } catch (error) {
      console.error("Error merging clients:", error)
      alert("Failed to merge clients")
    } finally {
      setMerging(null)
    }
  }

  const handleDismiss = async (duplicateId: string) => {
    try {
      const response = await fetch(`/api/clients/duplicates/${duplicateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolved: true }),
      })
      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ["duplicates"] })
      }
    } catch (error) {
      console.error("Error dismissing duplicate:", error)
    }
  }

  if (!session) {
    return <div>Loading...</div>
  }

  const unresolvedDuplicates = duplicates.filter(
    (d: Duplicate) => !d.resolved
  )

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Duplicate Detection</h1>
        <p className="text-muted-foreground mt-2">
          Review and merge duplicate client records
        </p>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3">Loading duplicates...</span>
            </div>
          </CardContent>
        </Card>
      ) : unresolvedDuplicates.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No duplicate clients found. Great job keeping your data clean!
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {unresolvedDuplicates.map((duplicate: Duplicate) => (
            <Card key={duplicate.id}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>
                    Potential Duplicate ({(duplicate.confidence * 100).toFixed(0)}% match)
                  </CardTitle>
                  <span className="text-sm text-muted-foreground">
                    Detected: {new Date(duplicate.detectedAt).toLocaleDateString()}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="border rounded p-4">
                    <h3 className="font-semibold mb-2">Primary Client</h3>
                    <div className="space-y-1 text-sm">
                      <div>
                        <span className="font-medium">Name:</span>{" "}
                        {duplicate.primaryClient.name}
                      </div>
                      {duplicate.primaryClient.email && (
                        <div>
                          <span className="font-medium">Email:</span>{" "}
                          {duplicate.primaryClient.email}
                        </div>
                      )}
                      {duplicate.primaryClient.phone && (
                        <div>
                          <span className="font-medium">Phone:</span>{" "}
                          {duplicate.primaryClient.phone}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="border rounded p-4">
                    <h3 className="font-semibold mb-2">Duplicate Client</h3>
                    <div className="space-y-1 text-sm">
                      <div>
                        <span className="font-medium">Name:</span>{" "}
                        {duplicate.duplicateClient.name}
                      </div>
                      {duplicate.duplicateClient.email && (
                        <div>
                          <span className="font-medium">Email:</span>{" "}
                          {duplicate.duplicateClient.email}
                        </div>
                      )}
                      {duplicate.duplicateClient.phone && (
                        <div>
                          <span className="font-medium">Phone:</span>{" "}
                          {duplicate.duplicateClient.phone}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() =>
                      handleMerge(
                        duplicate.primaryClient.id,
                        duplicate.duplicateClient.id
                      )
                    }
                    disabled={
                      merging ===
                      `${duplicate.primaryClient.id}-${duplicate.duplicateClient.id}`
                    }
                  >
                    {merging ===
                    `${duplicate.primaryClient.id}-${duplicate.duplicateClient.id}`
                      ? "Merging..."
                      : "Merge Clients"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDismiss(duplicate.id)}
                  >
                    Dismiss
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

