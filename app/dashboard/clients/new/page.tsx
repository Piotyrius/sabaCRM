"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Save, Loader2 } from "lucide-react"

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

export default function NewClientPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [offices, setOffices] = useState<any[]>([])
  const [desks, setDesks] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [formData, setFormData] = useState({
    clientId: "",
    name: "",
    country: "",
    email: "",
    phone: "",
    affiliate: "",
    affiliateSource: "",
    salesStatus: "INITIAL_CALL",
    salesDeskId: "",
    salesRepId: "",
    retentionDeskId: "",
    retentionRepId: "",
    ftdDate: "",
    balance: "0",
    note: "",
  })

  useEffect(() => {
    if (session) {
      fetchOffices()
      fetchDesks()
      fetchUsers()
    }
  }, [session])

  const fetchOffices = async () => {
    try {
      const response = await fetch("/api/offices")
      if (response.ok) {
        const data = await response.json()
        setOffices(data)
      }
    } catch (error) {
      console.error("Error fetching offices:", error)
    }
  }

  const fetchDesks = async () => {
    try {
      const response = await fetch("/api/desks")
      if (response.ok) {
        const data = await response.json()
        setDesks(data)
      }
    } catch (error) {
      console.error("Error fetching desks:", error)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          balance: parseFloat(formData.balance) || 0,
          ftdDate: formData.ftdDate || null,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        router.push(`/dashboard/clients/${data.id}`)
      } else {
        const data = await response.json()
        setError(data.error || "Failed to create client")
      }
    } catch (error) {
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add New Client</h1>
          <p className="text-gray-600 mt-1">Create a new client record</p>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-sm text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Client's primary details</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="clientId">Client ID</Label>
                <Input
                  id="clientId"
                  value={formData.clientId}
                  onChange={(e) =>
                    setFormData({ ...formData, clientId: e.target.value })
                  }
                  placeholder="Optional external ID"
                />
              </div>
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) =>
                    setFormData({ ...formData, country: e.target.value })
                  }
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="salesStatus">Sales Status</Label>
                <select
                  id="salesStatus"
                  className="w-full p-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500"
                  value={formData.salesStatus}
                  onChange={(e) =>
                    setFormData({ ...formData, salesStatus: e.target.value })
                  }
                >
                  {SALES_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assignments */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
            <CardTitle>Assignments</CardTitle>
            <CardDescription>Sales and retention team assignments</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="salesDeskId">Sales Desk</Label>
                <select
                  id="salesDeskId"
                  className="w-full p-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500"
                  value={formData.salesDeskId}
                  onChange={(e) =>
                    setFormData({ ...formData, salesDeskId: e.target.value })
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
              <div>
                <Label htmlFor="salesRepId">Sales Rep</Label>
                <select
                  id="salesRepId"
                  className="w-full p-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500"
                  value={formData.salesRepId}
                  onChange={(e) =>
                    setFormData({ ...formData, salesRepId: e.target.value })
                  }
                >
                  <option value="">None</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name || user.email}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="retentionDeskId">Retention Desk</Label>
                <select
                  id="retentionDeskId"
                  className="w-full p-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500"
                  value={formData.retentionDeskId}
                  onChange={(e) =>
                    setFormData({ ...formData, retentionDeskId: e.target.value })
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
              <div>
                <Label htmlFor="retentionRepId">Retention Rep</Label>
                <select
                  id="retentionRepId"
                  className="w-full p-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500"
                  value={formData.retentionRepId}
                  onChange={(e) =>
                    setFormData({ ...formData, retentionRepId: e.target.value })
                  }
                >
                  <option value="">None</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name || user.email}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Information */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
            <CardTitle>Financial Information</CardTitle>
            <CardDescription>Balance and transaction details</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="balance">Balance</Label>
                <Input
                  id="balance"
                  type="number"
                  step="0.01"
                  value={formData.balance}
                  onChange={(e) =>
                    setFormData({ ...formData, balance: e.target.value })
                  }
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="ftdDate">FTD Date</Label>
                <Input
                  id="ftdDate"
                  type="datetime-local"
                  value={formData.ftdDate}
                  onChange={(e) =>
                    setFormData({ ...formData, ftdDate: e.target.value })
                  }
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="note">Notes</Label>
              <textarea
                id="note"
                className="w-full p-3 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500 min-h-[100px]"
                value={formData.note}
                onChange={(e) =>
                  setFormData({ ...formData, note: e.target.value })
                }
                placeholder="Additional notes about this client..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Create Client
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
