"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Bell, Check, CheckCheck, X } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

export function NotificationBell() {
  const notifications = useQuery(api.notifications.getUserNotifications, { limit: 10 })
  const unreadCount = useQuery(api.notifications.getUnreadNotificationCount)
  const markAsRead = useMutation(api.notifications.markNotificationAsRead)
  const markAllAsRead = useMutation(api.notifications.markAllNotificationsAsRead)
  const deleteNotification = useMutation(api.notifications.deleteNotification)
  const [isOpen, setIsOpen] = useState(false)

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead({ notificationId: notificationId as any })
    } catch (error) {
      console.error("Failed to mark notification as read:", error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead()
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error)
    }
  }

  const handleDelete = async (notificationId: string) => {
    try {
      await deleteNotification({ notificationId: notificationId as any })
    } catch (error) {
      console.error("Failed to delete notification:", error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "task_assigned":
        return "👤"
      case "task_updated":
        return "📝"
      case "task_commented":
        return "💬"
      case "project_updated":
        return "📁"
      case "mention":
        return "@"
      default:
        return "🔔"
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount && unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end" forceMount>
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount && unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead}>
              <CheckCheck className="h-4 w-4 mr-1" />
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-96">
          {notifications && notifications.length > 0 ? (
            notifications.map((notification) => (
              <div
                key={notification._id}
                className={`p-3 border-b last:border-b-0 ${!notification.isRead ? "bg-blue-50" : ""}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{getNotificationIcon(notification.type)}</span>
                      <p className="text-sm font-medium">{notification.title}</p>
                      {!notification.isRead && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                    </div>
                    <p className="text-xs text-muted-foreground">{notification.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {!notification.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkAsRead(notification._id)}
                        className="h-6 w-6 p-0"
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(notification._id)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-muted-foreground">
              <Bell className="mx-auto h-12 w-12 mb-4" />
              <p>No notifications yet</p>
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
