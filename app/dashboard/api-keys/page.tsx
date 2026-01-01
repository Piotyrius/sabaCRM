"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ApiKey {
  id: string
  name: string
  key: string
  lastUsedAt: string | null
  expiresAt: string | null
  active: boolean
  createdAt: string
}

export default function ApiKeysPage() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    expiresAt: "",
  })
  const [newKey, setNewKey] = useState<string | null>(null)

  const { data: apiKeys = [], isLoading } = useQuery({
    queryKey: ["api-keys"],
    queryFn: async () => {
      const response = await fetch("/api/api-keys")
      if (!response.ok) throw new Error("Failed to fetch API keys")
      return response.json()
    },
    enabled: !!session,
  })

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          expiresAt: formData.expiresAt || null,
        }),
      })
      if (response.ok) {
        const data = await response.json()
        setNewKey(data.key)
        setShowCreateForm(false)
        setFormData({ name: "", expiresAt: "" })
        queryClient.invalidateQueries({ queryKey: ["api-keys"] })
      }
    } catch (error) {
      console.error("Error creating API key:", error)
    }
  }

  const handleToggle = async (id: string, active: boolean) => {
    try {
      const response = await fetch(`/api/api-keys/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !active }),
      })
      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ["api-keys"] })
      }
    } catch (error) {
      console.error("Error updating API key:", error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this API key?")) return
    try {
      const response = await fetch(`/api/api-keys/${id}`, {
        method: "DELETE",
      })
      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ["api-keys"] })
      }
    } catch (error) {
      console.error("Error deleting API key:", error)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert("Copied to clipboard!")
  }

  if (!session) {
    return <div>Loading...</div>
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">API Keys</h1>
          <p className="text-muted-foreground mt-2">
            Manage API keys for external integrations
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? "Cancel" : "Create API Key"}
        </Button>
      </div>

      {newKey && (
        <Card className="mb-6 border-green-500">
          <CardHeader>
            <CardTitle>API Key Created!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-2">
              <strong>Important:</strong> Copy this key now. You won't be able to see it again!
            </p>
            <div className="flex gap-2">
              <Input value={newKey} readOnly className="font-mono" />
              <Button onClick={() => copyToClipboard(newKey)}>Copy</Button>
            </div>
            <Button
              variant="outline"
              className="mt-2"
              onClick={() => setNewKey(null)}
            >
              Close
            </Button>
          </CardContent>
        </Card>
      )}

      {showCreateForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Create New API Key</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label htmlFor="name">Key Name *</Label>
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
                <Label htmlFor="expiresAt">Expiration Date (Optional)</Label>
                <Input
                  id="expiresAt"
                  type="datetime-local"
                  value={formData.expiresAt}
                  onChange={(e) =>
                    setFormData({ ...formData, expiresAt: e.target.value })
                  }
                />
              </div>
              <Button type="submit">Create API Key</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3">Loading API keys...</span>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {apiKeys.map((apiKey: ApiKey) => (
            <Card key={apiKey.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{apiKey.name}</h3>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          apiKey.active
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {apiKey.active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>
                        Key: <span className="font-mono">{apiKey.key.substring(0, 20)}...</span>
                      </div>
                      {apiKey.lastUsedAt && (
                        <div>
                          Last used:{" "}
                          {new Date(apiKey.lastUsedAt).toLocaleString()}
                        </div>
                      )}
                      {apiKey.expiresAt && (
                        <div>
                          Expires: {new Date(apiKey.expiresAt).toLocaleString()}
                        </div>
                      )}
                      <div>
                        Created: {new Date(apiKey.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggle(apiKey.id, apiKey.active)}
                    >
                      {apiKey.active ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(apiKey.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {apiKeys.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No API keys found. Create your first API key!
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

