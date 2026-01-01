"use client"

import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export function NotificationBell() {
  const router = useRouter()

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", "unread"],
    queryFn: async () => {
      const response = await fetch("/api/notifications?unread=true")
      if (!response.ok) throw new Error("Failed to fetch notifications")
      return response.json()
    },
    refetchInterval: 10000, // Poll every 10 seconds
  })

  const unreadCount = notifications.filter((n: any) => !n.read).length

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/dashboard/notifications")}
        className="relative"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>
    </div>
  )
}

