"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface User {
  id: string
  email: string
  name: string | null
  role: string
  office: { name: string } | null
  department: { name: string } | null
  desk: { name: string } | null
  createdAt: string
}

export default function UsersPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "EXECUTIVE",
    officeId: "",
    departmentId: "",
    deskId: "",
  })
  const [offices, setOffices] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [desks, setDesks] = useState<any[]>([])

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await fetch("/api/users")
      if (!response.ok) throw new Error("Failed to fetch users")
      return response.json()
    },
    enabled: !!session && session.user?.role === "ADMIN",
  })

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      fetchOffices()
      fetchDepartments()
      fetchDesks()
    }
  }, [session])

  const fetchOffices = async () => {
    try {
      const response = await fetch("/api/offices")
      if (response.ok) {
        setOffices(await response.json())
      }
    } catch (error) {
      console.error("Error fetching offices:", error)
    }
  }

  const fetchDepartments = async () => {
    try {
      const response = await fetch("/api/departments")
      if (response.ok) {
        setDepartments(await response.json())
      }
    } catch (error) {
      console.error("Error fetching departments:", error)
    }
  }

  const fetchDesks = async () => {
    try {
      const response = await fetch("/api/desks")
      if (response.ok) {
        setDesks(await response.json())
      }
    } catch (error) {
      console.error("Error fetching desks:", error)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      if (response.ok) {
        setShowCreateForm(false)
        setFormData({
          name: "",
          email: "",
          password: "",
          role: "EXECUTIVE",
          officeId: "",
          departmentId: "",
          deskId: "",
        })
        queryClient.invalidateQueries({ queryKey: ["users"] })
      }
    } catch (error) {
      console.error("Error creating user:", error)
    }
  }

  const handleUpdate = async (userId: string, updates: any) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })
      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ["users"] })
        setEditingUser(null)
      }
    } catch (error) {
      console.error("Error updating user:", error)
    }
  }

  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      })
      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ["users"] })
      }
    } catch (error) {
      console.error("Error deleting user:", error)
    }
  }

  if (session?.user?.role !== "ADMIN") {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p>You don't have permission to access this page.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage system users and their roles
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? "Cancel" : "Create User"}
        </Button>
      </div>

      {showCreateForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Create New User</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                    minLength={6}
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <select
                    id="role"
                    className="w-full p-2 border rounded"
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                  >
                    <option value="EXECUTIVE">Executive</option>
                    <option value="TEAM_LEADER">Team Leader</option>
                    <option value="MANAGER">Manager</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="officeId">Office</Label>
                  <select
                    id="officeId"
                    className="w-full p-2 border rounded"
                    value={formData.officeId}
                    onChange={(e) =>
                      setFormData({ ...formData, officeId: e.target.value })
                    }
                  >
                    <option value="">None</option>
                    {offices.map((office) => (
                      <option key={office.id} value={office.id}>
                        {office.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="departmentId">Department</Label>
                  <select
                    id="departmentId"
                    className="w-full p-2 border rounded"
                    value={formData.departmentId}
                    onChange={(e) =>
                      setFormData({ ...formData, departmentId: e.target.value })
                    }
                  >
                    <option value="">None</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="deskId">Desk</Label>
                  <select
                    id="deskId"
                    className="w-full p-2 border rounded"
                    value={formData.deskId}
                    onChange={(e) =>
                      setFormData({ ...formData, deskId: e.target.value })
                    }
                  >
                    <option value="">None</option>
                    {desks.map((desk) => (
                      <option key={desk.id} value={desk.id}>
                        {desk.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <Button type="submit">Create User</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3">Loading users...</span>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">Role</th>
                    <th className="text-left p-2">Office</th>
                    <th className="text-left p-2">Department</th>
                    <th className="text-left p-2">Desk</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user: User) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">{user.name || "-"}</td>
                      <td className="p-2">{user.email}</td>
                      <td className="p-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          {user.role}
                        </span>
                      </td>
                      <td className="p-2">{user.office?.name || "-"}</td>
                      <td className="p-2">{user.department?.name || "-"}</td>
                      <td className="p-2">{user.desk?.name || "-"}</td>
                      <td className="p-2">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingUser(user)}
                          >
                            Edit
                          </Button>
                          {user.id !== session?.user?.id && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(user.id)}
                            >
                              Delete
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {editingUser && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Edit User</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Role</Label>
                <select
                  className="w-full p-2 border rounded"
                  value={editingUser.role}
                  onChange={(e) =>
                    handleUpdate(editingUser.id, { role: e.target.value })
                  }
                >
                  <option value="EXECUTIVE">Executive</option>
                  <option value="TEAM_LEADER">Team Leader</option>
                  <option value="MANAGER">Manager</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setEditingUser(null)}>Cancel</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

