"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
  createdAt: string
}

export default function EmailPage() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<"templates" | "send" | "logs">(
    "templates"
  )
  const [showTemplateForm, setShowTemplateForm] = useState(false)
  const [templateForm, setTemplateForm] = useState({
    name: "",
    subject: "",
    body: "",
  })
  const [sendForm, setSendForm] = useState({
    to: "",
    cc: "",
    bcc: "",
    subject: "",
    body: "",
    templateId: "",
  })
  const [clients, setClients] = useState<any[]>([])

  const { data: templates = [] } = useQuery({
    queryKey: ["email-templates"],
    queryFn: async () => {
      const response = await fetch("/api/email/templates")
      if (!response.ok) throw new Error("Failed to fetch templates")
      return response.json()
    },
    enabled: !!session,
  })

  const { data: logs = [] } = useQuery({
    queryKey: ["email-logs"],
    queryFn: async () => {
      const response = await fetch("/api/email/logs")
      if (!response.ok) throw new Error("Failed to fetch logs")
      return response.json()
    },
    enabled: !!session && activeTab === "logs",
  })

  useEffect(() => {
    if (activeTab === "send") {
      fetchClients()
    }
  }, [activeTab])

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

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/email/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(templateForm),
      })
      if (response.ok) {
        setShowTemplateForm(false)
        setTemplateForm({ name: "", subject: "", body: "" })
        queryClient.invalidateQueries({ queryKey: ["email-templates"] })
      }
    } catch (error) {
      console.error("Error creating template:", error)
    }
  }

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sendForm),
      })
      if (response.ok) {
        setSendForm({
          to: "",
          cc: "",
          bcc: "",
          subject: "",
          body: "",
          templateId: "",
        })
        queryClient.invalidateQueries({ queryKey: ["email-logs"] })
        alert("Email sent successfully!")
      }
    } catch (error) {
      console.error("Error sending email:", error)
      alert("Failed to send email")
    }
  }

  const useTemplate = (template: EmailTemplate) => {
    setSendForm({
      ...sendForm,
      subject: template.subject,
      body: template.body,
      templateId: template.id,
    })
    setActiveTab("send")
  }

  if (!session) {
    return <div>Loading...</div>
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Email</h1>
        <p className="text-muted-foreground mt-2">
          Manage email templates and send emails
        </p>
      </div>

      <div className="mb-6 flex gap-2 border-b">
        <Button
          variant={activeTab === "templates" ? "default" : "ghost"}
          onClick={() => setActiveTab("templates")}
        >
          Templates
        </Button>
        <Button
          variant={activeTab === "send" ? "default" : "ghost"}
          onClick={() => setActiveTab("send")}
        >
          Send Email
        </Button>
        <Button
          variant={activeTab === "logs" ? "default" : "ghost"}
          onClick={() => setActiveTab("logs")}
        >
          Email Logs
        </Button>
      </div>

      {activeTab === "templates" && (
        <>
          <div className="mb-4">
            <Button onClick={() => setShowTemplateForm(!showTemplateForm)}>
              {showTemplateForm ? "Cancel" : "Create Template"}
            </Button>
          </div>

          {showTemplateForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Create Email Template</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateTemplate} className="space-y-4">
                  <div>
                    <Label htmlFor="template-name">Template Name *</Label>
                    <Input
                      id="template-name"
                      value={templateForm.name}
                      onChange={(e) =>
                        setTemplateForm({ ...templateForm, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="template-subject">Subject *</Label>
                    <Input
                      id="template-subject"
                      value={templateForm.subject}
                      onChange={(e) =>
                        setTemplateForm({
                          ...templateForm,
                          subject: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="template-body">Body *</Label>
                    <textarea
                      id="template-body"
                      className="w-full p-2 border rounded"
                      rows={10}
                      value={templateForm.body}
                      onChange={(e) =>
                        setTemplateForm({ ...templateForm, body: e.target.value })
                      }
                      required
                    />
                  </div>
                  <Button type="submit">Create Template</Button>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((template: EmailTemplate) => (
              <Card key={template.id}>
                <CardHeader>
                  <CardTitle>{template.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-medium mb-2">{template.subject}</p>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                    {template.body}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => useTemplate(template)}
                  >
                    Use Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {activeTab === "send" && (
        <Card>
          <CardHeader>
            <CardTitle>Send Email</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSendEmail} className="space-y-4">
              <div>
                <Label htmlFor="to">To *</Label>
                <Input
                  id="to"
                  type="email"
                  value={sendForm.to}
                  onChange={(e) =>
                    setSendForm({ ...sendForm, to: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cc">CC</Label>
                  <Input
                    id="cc"
                    type="email"
                    value={sendForm.cc}
                    onChange={(e) =>
                      setSendForm({ ...sendForm, cc: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="bcc">BCC</Label>
                  <Input
                    id="bcc"
                    type="email"
                    value={sendForm.bcc}
                    onChange={(e) =>
                      setSendForm({ ...sendForm, bcc: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  value={sendForm.subject}
                  onChange={(e) =>
                    setSendForm({ ...sendForm, subject: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="body">Body *</Label>
                <textarea
                  id="body"
                  className="w-full p-2 border rounded"
                  rows={10}
                  value={sendForm.body}
                  onChange={(e) =>
                    setSendForm({ ...sendForm, body: e.target.value })
                  }
                  required
                />
              </div>
              <Button type="submit">Send Email</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {activeTab === "logs" && (
        <Card>
          <CardHeader>
            <CardTitle>Email Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">To</th>
                    <th className="text-left p-2">Subject</th>
                    <th className="text-left p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log: any) => (
                    <tr key={log.id} className="border-b">
                      <td className="p-2 text-sm">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="p-2 text-sm">{log.to}</td>
                      <td className="p-2 text-sm">{log.subject}</td>
                      <td className="p-2">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            log.sent
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {log.sent ? "Sent" : "Failed"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

