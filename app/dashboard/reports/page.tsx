"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Report {
  id: string
  name: string
  description: string | null
  type: string
  createdAt: string
  schedules: any[]
}

export default function ReportsPage() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "CUSTOM",
  })

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["reports"],
    queryFn: async () => {
      const response = await fetch("/api/reports")
      if (!response.ok) throw new Error("Failed to fetch reports")
      return response.json()
    },
    enabled: !!session,
  })

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          config: {
            filters: {},
            columns: [],
          },
        }),
      })
      if (response.ok) {
        setShowCreateForm(false)
        setFormData({ name: "", description: "", type: "CUSTOM" })
        queryClient.invalidateQueries({ queryKey: ["reports"] })
      }
    } catch (error) {
      console.error("Error creating report:", error)
    }
  }

  const handleRun = async (reportId: string) => {
    try {
      const response = await fetch(`/api/reports/${reportId}/run`, {
        method: "POST",
      })
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `report-${reportId}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error("Error running report:", error)
    }
  }

  if (!session) {
    return <div>Loading...</div>
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage custom reports
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? "Cancel" : "Create Report"}
        </Button>
      </div>

      {showCreateForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Create New Report</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label htmlFor="name">Report Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  className="w-full p-2 border rounded"
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="type">Report Type</Label>
                <select
                  id="type"
                  className="w-full p-2 border rounded"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                >
                  <option value="CUSTOM">Custom</option>
                  <option value="TEMPLATE">Template</option>
                </select>
              </div>
              <Button type="submit">Create Report</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3">Loading reports...</span>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((report: Report) => (
            <Card key={report.id}>
              <CardHeader>
                <CardTitle>{report.name}</CardTitle>
              </CardHeader>
              <CardContent>
                {report.description && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {report.description}
                  </p>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    {report.type}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRun(report.id)}
                    >
                      Run Report
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        router.push(`/dashboard/reports/${report.id}/schedule`)
                      }
                    >
                      Manage Schedules
                    </Button>
                  </div>
                </div>
                {report.schedules && report.schedules.length > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    {report.schedules.length} schedule(s)
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {reports.length === 0 && (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              No reports found. Create your first report!
            </div>
          )}
        </div>
      )}
    </div>
  )
}

