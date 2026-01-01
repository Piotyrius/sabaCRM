"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Task {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  dueDate: string | null
  client: { id: string; name: string } | null
  assignedTo: { id: string; name: string | null; email: string }
  createdBy: { id: string; name: string | null; email: string }
  createdAt: string
  completedAt: string | null
}

export default function TasksPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showReminderForm, setShowReminderForm] = useState(false)
  const [reminderForm, setReminderForm] = useState({
    taskId: "",
    remindAt: "",
  })
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    clientId: "",
    assignedToId: "",
    priority: "MEDIUM",
    dueDate: "",
  })
  const [clients, setClients] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const response = await fetch("/api/tasks")
      if (!response.ok) throw new Error("Failed to fetch tasks")
      return response.json()
    },
    enabled: !!session,
  })

  useEffect(() => {
    fetchClients()
    fetchUsers()
  }, [session])

  const fetchClients = async () => {
    try {
      const response = await fetch("/api/clients?limit=1000")
      if (response.ok) {
        const data = await response.json()
        setClients(data.clients || [])
      }
    } catch (error) {
      console.error("Error fetching clients:", error)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users")
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          clientId: formData.clientId || null,
          dueDate: formData.dueDate || null,
        }),
      })
      if (response.ok) {
        setShowCreateForm(false)
        setFormData({
          title: "",
          description: "",
          clientId: "",
          assignedToId: "",
          priority: "MEDIUM",
          dueDate: "",
        })
        queryClient.invalidateQueries({ queryKey: ["tasks"] })
      }
    } catch (error) {
      console.error("Error creating task:", error)
    }
  }

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ["tasks"] })
      }
    } catch (error) {
      console.error("Error updating task:", error)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "bg-red-100 text-red-800"
      case "HIGH":
        return "bg-orange-100 text-orange-800"
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800"
      case "LOW":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800"
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800"
      case "CANCELLED":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-yellow-100 text-yellow-800"
    }
  }

  if (!session) {
    return <div>Loading...</div>
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tasks</h1>
          <p className="text-muted-foreground mt-2">
            Manage tasks and reminders
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? "Cancel" : "Create Task"}
        </Button>
      </div>

      {showCreateForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Create New Task</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="clientId">Client (Optional)</Label>
                  <select
                    id="clientId"
                    className="w-full p-2 border rounded"
                    value={formData.clientId}
                    onChange={(e) =>
                      setFormData({ ...formData, clientId: e.target.value })
                    }
                  >
                    <option value="">None</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="assignedToId">Assign To *</Label>
                  <select
                    id="assignedToId"
                    className="w-full p-2 border rounded"
                    value={formData.assignedToId}
                    onChange={(e) =>
                      setFormData({ ...formData, assignedToId: e.target.value })
                    }
                    required
                  >
                    <option value="">Select user...</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name || user.email}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <select
                    id="priority"
                    className="w-full p-2 border rounded"
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value })
                    }
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="datetime-local"
                    value={formData.dueDate}
                    onChange={(e) =>
                      setFormData({ ...formData, dueDate: e.target.value })
                    }
                  />
                </div>
              </div>
              <Button type="submit">Create Task</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3">Loading tasks...</span>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task: Task) => (
            <Card key={task.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{task.title}</CardTitle>
                  <div className="flex gap-2">
                    <span
                      className={`px-2 py-1 rounded text-xs ${getPriorityColor(
                        task.priority
                      )}`}
                    >
                      {task.priority}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs ${getStatusColor(
                        task.status
                      )}`}
                    >
                      {task.status}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {task.description && (
                  <p className="text-sm text-muted-foreground mb-3">
                    {task.description}
                  </p>
                )}
                <div className="space-y-2 text-sm">
                  {task.client && (
                    <div>
                      <span className="font-medium">Client: </span>
                      <button
                        onClick={() =>
                          router.push(`/dashboard/clients/${task.client?.id}`)
                        }
                        className="text-blue-600 hover:underline"
                      >
                        {task.client.name}
                      </button>
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Assigned to: </span>
                    {task.assignedTo.name || task.assignedTo.email}
                  </div>
                  {task.dueDate && (
                    <div>
                      <span className="font-medium">Due: </span>
                      {new Date(task.dueDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <div className="mt-4 flex gap-2">
                  {task.status !== "COMPLETED" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange(task.id, "COMPLETED")}
                    >
                      Complete
                    </Button>
                  )}
                  {task.status !== "IN_PROGRESS" && task.status !== "COMPLETED" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange(task.id, "IN_PROGRESS")}
                    >
                      Start
                    </Button>
                  )}
                  {task.status !== "CANCELLED" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange(task.id, "CANCELLED")}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setReminderForm({ taskId: task.id, remindAt: "" })
                      setShowReminderForm(true)
                    }}
                  >
                    Add Reminder
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {tasks.length === 0 && (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              No tasks found. Create your first task!
            </div>
          )}
        </div>
      )}

      {showReminderForm && (
        <Card className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <CardContent className="bg-white p-6 rounded-lg max-w-md w-full m-4">
            <h3 className="text-lg font-semibold mb-4">Add Reminder</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                try {
                  const response = await fetch(
                    `/api/tasks/${reminderForm.taskId}/reminders`,
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        remindAt: reminderForm.remindAt,
                      }),
                    }
                  )
                  if (response.ok) {
                    setShowReminderForm(false)
                    setReminderForm({ taskId: "", remindAt: "" })
                    queryClient.invalidateQueries({ queryKey: ["tasks"] })
                    alert("Reminder created!")
                  }
                } catch (error) {
                  console.error("Error creating reminder:", error)
                }
              }}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="remindAt">Remind At</Label>
                <Input
                  id="remindAt"
                  type="datetime-local"
                  value={reminderForm.remindAt}
                  onChange={(e) =>
                    setReminderForm({ ...reminderForm, remindAt: e.target.value })
                  }
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">Create Reminder</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowReminderForm(false)
                    setReminderForm({ taskId: "", remindAt: "" })
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

