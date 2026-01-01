"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  ArrowLeft,
  Save,
  User,
  Mail,
  Phone,
  Globe,
  DollarSign,
  Calendar,
  FileText,
  MessageSquare,
  History,
  Loader2,
  Edit2,
} from "lucide-react"

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

export default function ClientDetailPage() {
  const router = useRouter()
  const params = useParams()
  const clientId = params.id as string
  const [client, setClient] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [note, setNote] = useState("")
  const [desks, setDesks] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    fetchClient()
    fetchDesks()
    fetchUsers()
  }, [clientId])

  const fetchClient = async () => {
    try {
      const response = await fetch(`/api/clients/${clientId}`)
      if (response.ok) {
        const data = await response.json()
        setClient(data)
      }
    } catch (error) {
      console.error("Error fetching client:", error)
    } finally {
      setLoading(false)
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

  const handleUpdate = async (field: string, value: any) => {
    setSaving(true)
    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      })

      if (response.ok) {
        const updated = await response.json()
        setClient(updated)
      }
    } catch (error) {
      console.error("Error updating client:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!note.trim()) return

    try {
      const response = await fetch(`/api/clients/${clientId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: note }),
      })

      if (response.ok) {
        setNote("")
        fetchClient()
      }
    } catch (error) {
      console.error("Error adding note:", error)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      CONVERTED: "bg-green-100 text-green-800 border-green-200",
      HIGH_POTENTIAL: "bg-blue-100 text-blue-800 border-blue-200",
      LOW_POTENTIAL: "bg-yellow-100 text-yellow-800 border-yellow-200",
      CALLBACK: "bg-purple-100 text-purple-800 border-purple-200",
      NOT_INTERESTED: "bg-red-100 text-red-800 border-red-200",
    }
    return colors[status] || "bg-gray-100 text-gray-800 border-gray-200"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading client...</p>
        </div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Client not found</p>
        <Button onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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
            <h1 className="text-3xl font-bold text-gray-900">{client.name}</h1>
            <p className="text-gray-600 mt-1">
              {client.clientId || client.id.slice(0, 8)}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => setEditing(!editing)}
          className="border-gray-300"
        >
          <Edit2 className="w-4 h-4 mr-2" />
          {editing ? "Cancel Edit" : "Edit"}
        </Button>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-2">
        <span
          className={`px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(
            client.salesStatus
          )}`}
        >
          {client.salesStatus.replace(/_/g, " ")}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-600" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start space-x-3">
                  <Mail className="w-5 h-5 text-gray-400 mt-1" />
                  <div className="flex-1">
                    <Label className="text-xs text-gray-500">Email</Label>
                    {editing ? (
                      <Input
                        value={client.email || ""}
                        onChange={(e) => handleUpdate("email", e.target.value)}
                        onBlur={(e) => handleUpdate("email", e.target.value)}
                        className="mt-1 border-gray-300"
                      />
                    ) : (
                      <p className="text-sm font-medium text-gray-900 mt-1">
                        {client.email || "-"}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Phone className="w-5 h-5 text-gray-400 mt-1" />
                  <div className="flex-1">
                    <Label className="text-xs text-gray-500">Phone</Label>
                    {editing ? (
                      <Input
                        value={client.phone || ""}
                        onChange={(e) => handleUpdate("phone", e.target.value)}
                        onBlur={(e) => handleUpdate("phone", e.target.value)}
                        className="mt-1 border-gray-300"
                      />
                    ) : (
                      <p className="text-sm font-medium text-gray-900 mt-1">
                        {client.phone || "-"}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Globe className="w-5 h-5 text-gray-400 mt-1" />
                  <div className="flex-1">
                    <Label className="text-xs text-gray-500">Country</Label>
                    {editing ? (
                      <Input
                        value={client.country || ""}
                        onChange={(e) =>
                          handleUpdate("country", e.target.value)
                        }
                        onBlur={(e) => handleUpdate("country", e.target.value)}
                        className="mt-1 border-gray-300"
                      />
                    ) : (
                      <p className="text-sm font-medium text-gray-900 mt-1">
                        {client.country || "-"}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-1" />
                  <div className="flex-1">
                    <Label className="text-xs text-gray-500">
                      Registration Date
                    </Label>
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      {new Date(client.registrationDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
              <CardTitle className="flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                Financial Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Balance</Label>
                  {editing ? (
                    <Input
                      type="number"
                      step="0.01"
                      value={client.balance.toString()}
                      onChange={(e) =>
                        handleUpdate("balance", parseFloat(e.target.value) || 0)
                      }
                      onBlur={(e) =>
                        handleUpdate("balance", parseFloat(e.target.value) || 0)
                      }
                      className="mt-1 border-gray-300"
                    />
                  ) : (
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      ${client.balance.toFixed(2)}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-gray-500">FTD Date</Label>
                  {editing ? (
                    <Input
                      type="datetime-local"
                      value={
                        client.ftdDate
                          ? new Date(client.ftdDate).toISOString().slice(0, 16)
                          : ""
                      }
                      onChange={(e) => handleUpdate("ftdDate", e.target.value)}
                      className="mt-1 border-gray-300"
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      {client.ftdDate
                        ? new Date(client.ftdDate).toLocaleDateString()
                        : "-"}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2 text-gray-600" />
                Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleAddNote} className="mb-4">
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500 mb-3"
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add a note..."
                />
                <Button
                  type="submit"
                  size="sm"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600"
                >
                  Add Note
                </Button>
              </form>
              <div className="space-y-3">
                {client.notes?.map((note: any) => (
                  <div
                    key={note.id}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <p className="text-sm text-gray-900">{note.content}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(note.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
                {(!client.notes || client.notes.length === 0) && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No notes yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Communication History */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
              <CardTitle className="flex items-center">
                <MessageSquare className="w-5 h-5 mr-2 text-purple-600" />
                Communication History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  const formData = new FormData(e.currentTarget)
                  const type = formData.get("type") as string
                  const direction = formData.get("direction") as string
                  const subject = formData.get("subject") as string
                  const content = formData.get("content") as string

                  try {
                    const response = await fetch(
                      `/api/clients/${clientId}/communications`,
                      {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ type, direction, subject, content }),
                      }
                    )
                    if (response.ok) {
                      fetchClient()
                      e.currentTarget.reset()
                    }
                  } catch (error) {
                    console.error("Error adding communication:", error)
                  }
                }}
                className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <select
                    name="type"
                    className="p-2 border border-gray-300 rounded-md text-sm"
                    required
                  >
                    <option value="">Type...</option>
                    <option value="CALL">Call</option>
                    <option value="EMAIL">Email</option>
                    <option value="NOTE">Note</option>
                    <option value="MEETING">Meeting</option>
                  </select>
                  <select
                    name="direction"
                    className="p-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">Direction...</option>
                    <option value="INBOUND">Inbound</option>
                    <option value="OUTBOUND">Outbound</option>
                  </select>
                </div>
                <Input
                  name="subject"
                  placeholder="Subject (optional)"
                  className="mb-2 border-gray-300"
                />
                <textarea
                  name="content"
                  className="w-full p-2 border border-gray-300 rounded-md text-sm mb-2"
                  rows={2}
                  placeholder="Details..."
                  required
                />
                <Button type="submit" size="sm" className="w-full">
                  Add Communication
                </Button>
              </form>
              <div className="space-y-3">
                {client.communications?.map((comm: any) => (
                  <div
                    key={comm.id}
                    className="p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                          {comm.type}
                        </span>
                        {comm.direction && (
                          <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                            {comm.direction}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(comm.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {comm.subject && (
                      <p className="font-medium text-sm text-gray-900 mb-1">
                        {comm.subject}
                      </p>
                    )}
                    {comm.content && (
                      <p className="text-sm text-gray-700">{comm.content}</p>
                    )}
                  </div>
                ))}
                {(!client.communications ||
                  client.communications.length === 0) && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No communications recorded
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Assignments */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b">
              <CardTitle className="text-lg">Assignments</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {editing ? (
                <>
                  <div>
                    <Label>Sales Status</Label>
                    <select
                      className="w-full p-2 border border-gray-300 rounded-md mt-1"
                      value={client.salesStatus}
                      onChange={(e) =>
                        handleUpdate("salesStatus", e.target.value)
                      }
                    >
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
                      className="w-full p-2 border border-gray-300 rounded-md mt-1"
                      value={client.salesDeskId || ""}
                      onChange={(e) =>
                        handleUpdate("salesDeskId", e.target.value)
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
                    <Label>Sales Rep</Label>
                    <select
                      className="w-full p-2 border border-gray-300 rounded-md mt-1"
                      value={client.salesRepId || ""}
                      onChange={(e) =>
                        handleUpdate("salesRepId", e.target.value)
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
                    <Label>Retention Desk</Label>
                    <select
                      className="w-full p-2 border border-gray-300 rounded-md mt-1"
                      value={client.retentionDeskId || ""}
                      onChange={(e) =>
                        handleUpdate("retentionDeskId", e.target.value)
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
                    <Label>Retention Rep</Label>
                    <select
                      className="w-full p-2 border border-gray-300 rounded-md mt-1"
                      value={client.retentionRepId || ""}
                      onChange={(e) =>
                        handleUpdate("retentionRepId", e.target.value)
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
                </>
              ) : (
                <>
                  <div>
                    <Label className="text-xs text-gray-500">Sales Desk</Label>
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      {client.salesDesk?.name || "-"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Sales Rep</Label>
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      {client.salesRep?.name || "-"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">
                      Retention Desk
                    </Label>
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      {client.retentionDesk?.name || "-"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">
                      Retention Rep
                    </Label>
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      {client.retentionRep?.name || "-"}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Status History */}
          {client.statusHistory && client.statusHistory.length > 0 && (
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                <CardTitle className="flex items-center text-lg">
                  <History className="w-5 h-5 mr-2 text-gray-600" />
                  Status History
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {client.statusHistory.map((history: any) => (
                    <div
                      key={history.id}
                      className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <p className="text-sm font-medium text-gray-900">
                        {history.oldStatus || "N/A"} → {history.newStatus}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(history.createdAt).toLocaleString()} by{" "}
                        {history.changedBy?.name || "Unknown"}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
