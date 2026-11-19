"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell,
  Check,
  CheckCheck,
  MessageSquare,
  User,
  FolderOpen,
  Calendar,
  AlertTriangle,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";

// Mock notifications data
const mockNotifications = [
  {
    id: "1",
    type: "task_assigned" as const,
    title: "Task Assigned",
    message: "You have been assigned to 'Design homepage mockups'",
    entityType: "task" as const,
    entityId: "task_1",
    isRead: false,
    priority: "normal" as const,
    createdAt: new Date("2024-01-20T10:30:00"),
    sender: {
      name: "Sarah Wilson",
      avatar: "/placeholder.svg",
    },
  },
  {
    id: "2",
    type: "mention" as const,
    title: "You were mentioned",
    message:
      "Mike Johnson mentioned you in a comment on 'Database schema setup'",
    entityType: "comment" as const,
    entityId: "comment_1",
    isRead: false,
    priority: "high" as const,
    createdAt: new Date("2024-01-20T09:15:00"),
    sender: {
      name: "Mike Johnson",
      avatar: "/placeholder.svg",
    },
  },
  {
    id: "3",
    type: "task_completed" as const,
    title: "Task Completed",
    message: "Alex Chen completed 'Mobile responsive layout'",
    entityType: "task" as const,
    entityId: "task_4",
    isRead: true,
    priority: "normal" as const,
    createdAt: new Date("2024-01-19T16:45:00"),
    sender: {
      name: "Alex Chen",
      avatar: "/placeholder.svg",
    },
  },
  {
    id: "4",
    type: "deadline_approaching" as const,
    title: "Deadline Approaching",
    message: "Task 'User authentication implementation' is due in 2 days",
    entityType: "task" as const,
    entityId: "task_2",
    isRead: false,
    priority: "urgent" as const,
    createdAt: new Date("2024-01-19T14:20:00"),
    sender: {
      name: "System",
      avatar: "/placeholder.svg",
    },
  },
];

const notificationIcons = {
  task_assigned: User,
  task_completed: Check,
  mention: MessageSquare,
  deadline_approaching: AlertTriangle,
  task_updated: FolderOpen,
  comment_added: MessageSquare,
  project_created: FolderOpen,
};

const priorityColors = {
  low: "bg-gray-100 text-gray-800",
  normal: "bg-blue-100 text-blue-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
};

export function NotificationsPanel() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState(mockNotifications);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = (notificationId: string) => {
    setNotifications(
      notifications.map((n) =>
        n.id === notificationId ? { ...n, isRead: true } : n
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(notifications.filter((n) => n.id !== notificationId));
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    return "Just now";
  };

  const unreadNotifications = notifications.filter((n) => !n.isRead);
  const readNotifications = notifications.filter((n) => n.isRead);

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-lg">Notifications</CardTitle>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              <CheckCheck className="w-4 h-4 mr-2" />
              Mark all read
            </Button>
          )}
        </div>
        <CardDescription>
          Stay updated with your team's activities
        </CardDescription>
      </CardHeader>

      <CardContent className="p-0">
        <Tabs defaultValue="all" className="w-full">
          <div className="px-6 pb-2">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
              <TabsTrigger value="read">Read</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all" className="mt-0">
            <ScrollArea className="h-96">
              <div className="space-y-1">
                {notifications.map((notification, index) => {
                  const IconComponent =
                    notificationIcons[notification.type] || Bell;

                  return (
                    <div key={notification.id}>
                      <div
                        className={`p-4 hover:bg-gray-50 transition-colors ${
                          !notification.isRead ? "bg-blue-50" : ""
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`p-2 rounded-full ${
                              !notification.isRead
                                ? "bg-blue-100"
                                : "bg-gray-100"
                            }`}
                          >
                            <IconComponent
                              className={`w-4 h-4 ${
                                !notification.isRead
                                  ? "text-blue-600"
                                  : "text-gray-600"
                              }`}
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="text-sm font-medium text-gray-900">
                                    {notification.title}
                                  </p>
                                  <Badge
                                    className={
                                      priorityColors[notification.priority]
                                    }
                                    variant="secondary"
                                  >
                                    {notification.priority}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">
                                  {notification.message}
                                </p>
                                <div className="flex items-center gap-2">
                                  <Avatar className="w-5 h-5">
                                    <AvatarFallback className="text-xs">
                                      {notification.sender.name
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs text-gray-500">
                                    {notification.sender.name} •{" "}
                                    {getTimeAgo(notification.createdAt)}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 ml-2">
                                {!notification.isRead && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => markAsRead(notification.id)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <Check className="w-3 h-3" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    deleteNotification(notification.id)
                                  }
                                  className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      {index < notifications.length - 1 && <Separator />}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="unread" className="mt-0">
            <ScrollArea className="h-96">
              <div className="space-y-1">
                {unreadNotifications.length > 0 ? (
                  unreadNotifications.map((notification, index) => {
                    const IconComponent =
                      notificationIcons[notification.type] || Bell;

                    return (
                      <div key={notification.id}>
                        <div className="p-4 hover:bg-gray-50 transition-colors bg-blue-50">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-full bg-blue-100">
                              <IconComponent className="w-4 h-4 text-blue-600" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="text-sm font-medium text-gray-900">
                                      {notification.title}
                                    </p>
                                    <Badge
                                      className={
                                        priorityColors[notification.priority]
                                      }
                                      variant="secondary"
                                    >
                                      {notification.priority}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-gray-600 mb-2">
                                    {notification.message}
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <Avatar className="w-5 h-5">
                                      <AvatarFallback className="text-xs">
                                        {notification.sender.name
                                          .split(" ")
                                          .map((n) => n[0])
                                          .join("")}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-xs text-gray-500">
                                      {notification.sender.name} •{" "}
                                      {getTimeAgo(notification.createdAt)}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 ml-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => markAsRead(notification.id)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <Check className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      deleteNotification(notification.id)
                                    }
                                    className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        {index < unreadNotifications.length - 1 && (
                          <Separator />
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center">
                    <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No unread notifications</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="read" className="mt-0">
            <ScrollArea className="h-96">
              <div className="space-y-1">
                {readNotifications.length > 0 ? (
                  readNotifications.map((notification, index) => {
                    const IconComponent =
                      notificationIcons[notification.type] || Bell;

                    return (
                      <div key={notification.id}>
                        <div className="p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-full bg-gray-100">
                              <IconComponent className="w-4 h-4 text-gray-600" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="text-sm font-medium text-gray-900">
                                      {notification.title}
                                    </p>
                                    <Badge
                                      className={
                                        priorityColors[notification.priority]
                                      }
                                      variant="secondary"
                                    >
                                      {notification.priority}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-gray-600 mb-2">
                                    {notification.message}
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <Avatar className="w-5 h-5">
                                      <AvatarFallback className="text-xs">
                                        {notification.sender.name
                                          .split(" ")
                                          .map((n) => n[0])
                                          .join("")}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-xs text-gray-500">
                                      {notification.sender.name} •{" "}
                                      {getTimeAgo(notification.createdAt)}
                                    </span>
                                  </div>
                                </div>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    deleteNotification(notification.id)
                                  }
                                  className="h-6 w-6 p-0 text-gray-400 hover:text-red-600 ml-2"
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                        {index < readNotifications.length - 1 && <Separator />}
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center">
                    <CheckCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No read notifications</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
