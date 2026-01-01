"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

const SALES_STATUSES = [
  "NO_ANSWER",
  "NEVER_ANSWER",
  "LOW_POTENTIAL",
  "HIGH_POTENTIAL",
  "CALLBACK",
  "CONVERTED",
  "NOT_INTERESTED",
  "NO_POTENTIAL",
  "HUNG_UP",
  "INITIAL_CALL",
  "INVALID_COUNTRY",
  "INVALID_LANGUAGE",
  "WRONG_NUMBER",
  "WRONG_PERSON",
  "TEST",
  "REASSIGN",
  "WRONG_INFO",
  "UNDER18",
]

interface BulkActionsProps {
  selectedIds: string[]
  onSuccess: () => void
  desks?: any[]
  users?: any[]
}

export function BulkActions({
  selectedIds,
  onSuccess,
  desks = [],
  users = [],
}: BulkActionsProps) {
  const [showActions, setShowActions] = useState(false)
  const [loading, setLoading] = useState(false)
  const [updates, setUpdates] = useState({
    salesStatus: "",
    salesRepId: "",
    retentionRepId: "",
    salesDeskId: "",
    retentionDeskId: "",
  })

  const handleBulkUpdate = async () => {
    if (selectedIds.length === 0) return

    setLoading(true)
    try {
      const updateData: any = {}
      if (updates.salesStatus) updateData.salesStatus = updates.salesStatus
      if (updates.salesRepId)
        updateData.salesRepId = updates.salesRepId || null
      if (updates.retentionRepId)
        updateData.retentionRepId = updates.retentionRepId || null
      if (updates.salesDeskId)
        updateData.salesDeskId = updates.salesDeskId || null
      if (updates.retentionDeskId)
        updateData.retentionDeskId = updates.retentionDeskId || null

      const response = await fetch("/api/clients/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientIds: selectedIds,
          updates: updateData,
        }),
      })

      if (response.ok) {
        onSuccess()
        setShowActions(false)
        setUpdates({
          salesStatus: "",
          salesRepId: "",
          retentionRepId: "",
          salesDeskId: "",
          retentionDeskId: "",
        })
      }
    } catch (error) {
      console.error("Error performing bulk update:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} clients?`))
      return

    setLoading(true)
    try {
      const response = await fetch("/api/clients/bulk", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientIds: selectedIds }),
      })

      if (response.ok) {
        onSuccess()
        setShowActions(false)
      }
    } catch (error) {
      console.error("Error performing bulk delete:", error)
    } finally {
      setLoading(false)
    }
  }

  if (selectedIds.length === 0) return null

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>
          Bulk Actions ({selectedIds.length} selected)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Button
            variant="outline"
            onClick={() => setShowActions(!showActions)}
          >
            {showActions ? "Hide" : "Show"} Update Options
          </Button>
          <Button variant="destructive" onClick={handleBulkDelete} disabled={loading}>
            Delete Selected
          </Button>
        </div>

        {showActions && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label>Sales Status</Label>
              <select
                className="w-full p-2 border rounded"
                value={updates.salesStatus}
                onChange={(e) =>
                  setUpdates({ ...updates, salesStatus: e.target.value })
                }
              >
                <option value="">No change</option>
                {SALES_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>Sales Desk</Label>
              <select
                className="w-full p-2 border rounded"
                value={updates.salesDeskId}
                onChange={(e) =>
                  setUpdates({ ...updates, salesDeskId: e.target.value })
                }
              >
                <option value="">No change</option>
                {desks.map((desk) => (
                  <option key={desk.id} value={desk.id}>
                    {desk.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>Sales Rep</Label>
              <select
                className="w-full p-2 border rounded"
                value={updates.salesRepId}
                onChange={(e) =>
                  setUpdates({ ...updates, salesRepId: e.target.value })
                }
              >
                <option value="">No change</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name || user.email}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>Retention Desk</Label>
              <select
                className="w-full p-2 border rounded"
                value={updates.retentionDeskId}
                onChange={(e) =>
                  setUpdates({ ...updates, retentionDeskId: e.target.value })
                }
              >
                <option value="">No change</option>
                {desks.map((desk) => (
                  <option key={desk.id} value={desk.id}>
                    {desk.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>Retention Rep</Label>
              <select
                className="w-full p-2 border rounded"
                value={updates.retentionRepId}
                onChange={(e) =>
                  setUpdates({ ...updates, retentionRepId: e.target.value })
                }
              >
                <option value="">No change</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name || user.email}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <Button onClick={handleBulkUpdate} disabled={loading}>
                {loading ? "Updating..." : "Apply Updates"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

