"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Office {
  id: string
  name: string
  departments: Department[]
  _count: { users: number }
}

interface Department {
  id: string
  name: string
  officeId: string
  desks: Desk[]
  _count: { users: number }
}

interface Desk {
  id: string
  name: string
  departmentId: string
  _count: { users: number }
}

export default function TeamsPage() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [showOfficeForm, setShowOfficeForm] = useState(false)
  const [showDeptForm, setShowDeptForm] = useState(false)
  const [showDeskForm, setShowDeskForm] = useState(false)
  const [selectedOfficeId, setSelectedOfficeId] = useState<string>("")
  const [selectedDeptId, setSelectedDeptId] = useState<string>("")
  const [formData, setFormData] = useState({ name: "" })

  const isAdmin = session?.user?.role === "ADMIN"

  const { data: offices = [], isLoading: loading } = useQuery({
    queryKey: ["offices"],
    queryFn: async () => {
      const response = await fetch("/api/offices")
      if (!response.ok) throw new Error("Failed to fetch offices")
      return response.json()
    },
    enabled: !!session && isAdmin,
  })

  const handleCreateOffice = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/offices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      if (response.ok) {
        setFormData({ name: "" })
        setShowOfficeForm(false)
        queryClient.invalidateQueries({ queryKey: ["offices"] })
      }
    } catch (error) {
      console.error("Error creating office:", error)
    }
  }

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOfficeId) return
    try {
      const response = await fetch("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, officeId: selectedOfficeId }),
      })
      if (response.ok) {
        setFormData({ name: "" })
        setShowDeptForm(false)
        queryClient.invalidateQueries({ queryKey: ["offices"] })
      }
    } catch (error) {
      console.error("Error creating department:", error)
    }
  }

  const handleCreateDesk = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDeptId) return
    try {
      const response = await fetch("/api/desks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, departmentId: selectedDeptId }),
      })
      if (response.ok) {
        setFormData({ name: "" })
        setShowDeskForm(false)
        queryClient.invalidateQueries({ queryKey: ["offices"] })
      }
    } catch (error) {
      console.error("Error creating desk:", error)
    }
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Organizational Structure</h1>
        <p className="text-muted-foreground mt-2">
          Manage offices, departments, and desks
        </p>
      </div>

      {isAdmin && (
        <div className="mb-6 space-x-4">
          <Button onClick={() => setShowOfficeForm(true)}>Add Office</Button>
          <Button onClick={() => setShowDeptForm(true)}>Add Department</Button>
          <Button onClick={() => setShowDeskForm(true)}>Add Desk</Button>
        </div>
      )}

      {showOfficeForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Create Office</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateOffice} className="space-y-4">
              <div>
                <Label>Office Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">Create</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowOfficeForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {showDeptForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Create Department</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateDepartment} className="space-y-4">
              <div>
                <Label>Select Office</Label>
                <select
                  className="w-full p-2 border rounded"
                  value={selectedOfficeId}
                  onChange={(e) => setSelectedOfficeId(e.target.value)}
                  required
                >
                  <option value="">Select office...</option>
                  {offices.map((office) => (
                    <option key={office.id} value={office.id}>
                      {office.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Department Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">Create</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDeptForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {showDeskForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Create Desk</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateDesk} className="space-y-4">
              <div>
                <Label>Select Department</Label>
                <select
                  className="w-full p-2 border rounded"
                  value={selectedDeptId}
                  onChange={(e) => setSelectedDeptId(e.target.value)}
                  required
                >
                  <option value="">Select department...</option>
                  {offices.flatMap((office) =>
                    office.departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {office.name} - {dept.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div>
                <Label>Desk Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">Create</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDeskForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        {offices.map((office) => (
          <Card key={office.id}>
            <CardHeader>
              <CardTitle>{office.name}</CardTitle>
              <CardDescription>
                {office._count?.users || 0} users, {office.departments?.length || 0}{" "}
                departments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {office.departments?.map((dept) => (
                  <div key={dept.id} className="ml-4 border-l-2 pl-4">
                    <h3 className="font-semibold">{dept.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {dept._count?.users || 0} users, {dept.desks?.length || 0} desks
                    </p>
                    <div className="ml-4 space-y-2">
                      {dept.desks?.map((desk) => (
                        <div key={desk.id} className="text-sm">
                          <span className="font-medium">{desk.name}</span>
                          <span className="text-muted-foreground ml-2">
                            ({desk._count?.users || 0} users)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

