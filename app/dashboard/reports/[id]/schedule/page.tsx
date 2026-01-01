"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ReportSchedulePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const reportId = params.id as string
  const queryClient = useQueryClient()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    frequency: "DAILY",
    dayOfWeek: "",
    dayOfMonth: "",
    time: "09:00",
    enabled: true,
  })

  const { data: schedules = [] } = useQuery({
    queryKey: ["report-schedules", reportId],
    queryFn: async () => {
      const response = await fetch(`/api/reports/${reportId}/schedules`)
      if (!response.ok) throw new Error("Failed to fetch schedules")
      return response.json()
    },
    enabled: !!session && !!reportId,
  })

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch(`/api/reports/${reportId}/schedules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          dayOfWeek: formData.frequency === "WEEKLY" ? parseInt(formData.dayOfWeek) : null,
          dayOfMonth: formData.frequency === "MONTHLY" ? parseInt(formData.dayOfMonth) : null,
        }),
      })
      if (response.ok) {
        setShowCreateForm(false)
        setFormData({
          frequency: "DAILY",
          dayOfWeek: "",
          dayOfMonth: "",
          time: "09:00",
          enabled: true,
        })
        queryClient.invalidateQueries({ queryKey: ["report-schedules"] })
      }
    } catch (error) {
      console.error("Error creating schedule:", error)
    }
  }

  const handleToggle = async (scheduleId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/reports/schedules/${scheduleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !enabled }),
      })
      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ["report-schedules"] })
      }
    } catch (error) {
      console.error("Error updating schedule:", error)
    }
  }

  if (!session) {
    return <div>Loading...</div>
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Report Schedules</h1>
          <p className="text-muted-foreground mt-2">
            Manage scheduled report generation
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            Back
          </Button>
          <Button onClick={() => setShowCreateForm(!showCreateForm)}>
            {showCreateForm ? "Cancel" : "Create Schedule"}
          </Button>
        </div>
      </div>

      {showCreateForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Create Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label htmlFor="frequency">Frequency</Label>
                <select
                  id="frequency"
                  className="w-full p-2 border rounded"
                  value={formData.frequency}
                  onChange={(e) =>
                    setFormData({ ...formData, frequency: e.target.value })
                  }
                >
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                </select>
              </div>
              {formData.frequency === "WEEKLY" && (
                <div>
                  <Label htmlFor="dayOfWeek">Day of Week (0=Sunday, 6=Saturday)</Label>
                  <Input
                    id="dayOfWeek"
                    type="number"
                    min="0"
                    max="6"
                    value={formData.dayOfWeek}
                    onChange={(e) =>
                      setFormData({ ...formData, dayOfWeek: e.target.value })
                    }
                    required
                  />
                </div>
              )}
              {formData.frequency === "MONTHLY" && (
                <div>
                  <Label htmlFor="dayOfMonth">Day of Month (1-31)</Label>
                  <Input
                    id="dayOfMonth"
                    type="number"
                    min="1"
                    max="31"
                    value={formData.dayOfMonth}
                    onChange={(e) =>
                      setFormData({ ...formData, dayOfMonth: e.target.value })
                    }
                    required
                  />
                </div>
              )}
              <div>
                <Label htmlFor="time">Time (HH:MM)</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) =>
                    setFormData({ ...formData, time: e.target.value })
                  }
                  required
                />
              </div>
              <Button type="submit">Create Schedule</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {schedules.map((schedule: any) => (
          <Card key={schedule.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{schedule.frequency}</h3>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        schedule.enabled
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {schedule.enabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>Time: {schedule.time}</div>
                    {schedule.dayOfWeek !== null && (
                      <div>Day of Week: {schedule.dayOfWeek}</div>
                    )}
                    {schedule.dayOfMonth !== null && (
                      <div>Day of Month: {schedule.dayOfMonth}</div>
                    )}
                    {schedule.lastRunAt && (
                      <div>
                        Last run: {new Date(schedule.lastRunAt).toLocaleString()}
                      </div>
                    )}
                    {schedule.nextRunAt && (
                      <div>
                        Next run: {new Date(schedule.nextRunAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleToggle(schedule.id, schedule.enabled)}
                >
                  {schedule.enabled ? "Disable" : "Enable"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {schedules.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No schedules found. Create your first schedule!
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

