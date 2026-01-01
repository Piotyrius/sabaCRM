"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  link: string | null
  createdAt: string
  readAt: string | null
}

export default function NotificationsPage() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<"all" | "unread">("unread")

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications", filter],
    queryFn: async () => {
      const response = await fetch(
        `/api/notifications?${filter === "unread" ? "unread=true" : ""}`
      )
      if (!response.ok) throw new Error("Failed to fetch notifications")
      return response.json()
    },
    enabled: !!session,
    refetchInterval: 5000, // Poll every 5 seconds
  })

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: true }),
      })
      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ["notifications"] })
      }
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch("/api/notifications/read-all", {
        method: "POST",
      })
      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ["notifications"] })
      }
    } catch (error) {
      console.error("Error marking all as read:", error)
    }
  }

  const unreadCount = notifications.filter((n: Notification) => !n.read).length

  if (!session) {
    return <div>Loading...</div>
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground mt-2">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
              : "All caught up!"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setFilter(filter === "all" ? "unread" : "all")}
          >
            {filter === "all" ? "Show Unread" : "Show All"}
          </Button>
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>
              Mark All as Read
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3">Loading notifications...</span>
            </div>
          </CardContent>
        </Card>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No notifications found
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification: Notification) => (
            <Card
              key={notification.id}
              className={!notification.read ? "border-blue-500" : ""}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                      <h3 className="font-semibold">{notification.title}</h3>
                      <span className="text-xs text-muted-foreground">
                        {new Date(notification.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {notification.message}
                    </p>
                    {notification.link && (
                      <Link
                        href={notification.link}
                        className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                        onClick={() => markAsRead(notification.id)}
                      >
                        View →
                      </Link>
                    )}
                  </div>
                  {!notification.read && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => markAsRead(notification.id)}
                    >
                      Mark Read
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

