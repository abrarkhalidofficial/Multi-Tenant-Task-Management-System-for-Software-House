"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Activity,
  User,
  FolderOpen,
  CheckSquare,
  MessageSquare,
  FileText,
  Calendar,
  Settings,
  Plus,
  Edit,
  Trash2,
  Eye,
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";

// Mock activity data
const mockActivities = [
  {
    id: "1",
    userId: "user_2",
    userName: "Sarah Wilson",
    userAvatar: "/placeholder.svg",
    action: "created",
    entityType: "project",
    entityName: "E-commerce Platform Redesign",
    entityId: "proj_1",
    details: "Started a new project with 4 team members",
    timestamp: new Date("2024-01-20T10:30:00"),
    projectId: null,
    taskId: null,
  },
  {
    id: "2",
    userId: "user_3",
    userName: "Mike Johnson",
    userAvatar: "/placeholder.svg",
    action: "completed",
    entityType: "task",
    entityName: "Design homepage mockups",
    entityId: "task_1",
    details: "Marked task as completed",
    timestamp: new Date("2024-01-20T09:15:00"),
    projectId: "proj_1",
    taskId: "task_1",
  },
  {
    id: "3",
    userId: "user_4",
    userName: "Alex Chen",
    userAvatar: "/placeholder.svg",
    action: "commented",
    entityType: "task",
    entityName: "Mobile responsive layout",
    entityId: "task_4",
    details:
      "Added a comment: 'The mobile layout looks great! Just need to adjust the spacing on smaller screens.'",
    timestamp: new Date("2024-01-19T16:45:00"),
    projectId: "proj_1",
    taskId: "task_4",
  },
  {
    id: "4",
    userId: "user_2",
    userName: "Sarah Wilson",
    userAvatar: "/placeholder.svg",
    action: "assigned",
    entityType: "task",
    entityName: "User authentication implementation",
    entityId: "task_2",
    details: "Assigned task to Mike Johnson",
    timestamp: new Date("2024-01-19T14:20:00"),
    projectId: "proj_1",
    taskId: "task_2",
  },
  {
    id: "5",
    userId: "user_5",
    userName: "Emma Davis",
    userAvatar: "/placeholder.svg",
    action: "uploaded",
    entityType: "file",
    entityName: "database_schema_v2.pdf",
    entityId: "file_1",
    details: "Uploaded a new file to the project",
    timestamp: new Date("2024-01-19T11:30:00"),
    projectId: "proj_1",
    taskId: null,
  },
  {
    id: "6",
    userId: "user_3",
    userName: "Mike Johnson",
    userAvatar: "/placeholder.svg",
    action: "updated",
    entityType: "project",
    entityName: "E-commerce Platform Redesign",
    entityId: "proj_1",
    details: "Updated project deadline to March 15, 2024",
    timestamp: new Date("2024-01-18T15:45:00"),
    projectId: "proj_1",
    taskId: null,
  },
];

const actionIcons = {
  created: Plus,
  updated: Edit,
  deleted: Trash2,
  completed: CheckSquare,
  assigned: User,
  commented: MessageSquare,
  uploaded: FileText,
  viewed: Eye,
};

const entityTypeColors = {
  project: "bg-blue-100 text-blue-800",
  task: "bg-green-100 text-green-800",
  comment: "bg-purple-100 text-purple-800",
  file: "bg-orange-100 text-orange-800",
  user: "bg-indigo-100 text-indigo-800",
};

interface ActivityFeedProps {
  projectId?: string;
  limit?: number;
}

export function ActivityFeed({ projectId, limit }: ActivityFeedProps) {
  const { user } = useAuth();
  const [activities] = useState(mockActivities);
  const [filter, setFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");

  const filteredActivities = activities
    .filter((activity) => !projectId || activity.projectId === projectId)
    .filter((activity) => filter === "all" || activity.action === filter)
    .filter(
      (activity) =>
        entityFilter === "all" || activity.entityType === entityFilter
    )
    .slice(0, limit || activities.length);

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    if (diffHours > 0)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffMinutes > 0)
      return `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""} ago`;
    return "Just now";
  };

  const formatAction = (action: string, entityType: string) => {
    const actionMap = {
      created: `created ${entityType}`,
      updated: `updated ${entityType}`,
      deleted: `deleted ${entityType}`,
      completed: `completed ${entityType}`,
      assigned: `assigned ${entityType}`,
      commented: `commented on ${entityType}`,
      uploaded: `uploaded ${entityType}`,
      viewed: `viewed ${entityType}`,
    };
    return actionMap[action as keyof typeof actionMap] || action;
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-lg">Activity Feed</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="created">Created</SelectItem>
                <SelectItem value="updated">Updated</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="commented">Commented</SelectItem>
              </SelectContent>
            </Select>

            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="project">Projects</SelectItem>
                <SelectItem value="task">Tasks</SelectItem>
                <SelectItem value="comment">Comments</SelectItem>
                <SelectItem value="file">Files</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <CardDescription>
          Track all activities and changes in your workspace
        </CardDescription>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-96">
          <div className="space-y-1">
            {filteredActivities.length > 0 ? (
              filteredActivities.map((activity, index) => {
                const IconComponent =
                  actionIcons[activity.action as keyof typeof actionIcons] ||
                  Activity;

                return (
                  <div key={activity.id}>
                    <div className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-xs">
                            {activity.userName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm font-medium text-gray-900">
                                  {activity.userName}
                                </p>
                                <IconComponent className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-600">
                                  {formatAction(
                                    activity.action,
                                    activity.entityType
                                  )}
                                </span>
                                <Badge
                                  className={
                                    entityTypeColors[
                                      activity.entityType as keyof typeof entityTypeColors
                                    ]
                                  }
                                  variant="secondary"
                                >
                                  {activity.entityType}
                                </Badge>
                              </div>

                              <p className="text-sm font-medium text-blue-600 mb-1">
                                {activity.entityName}
                              </p>

                              {activity.details && (
                                <p className="text-sm text-gray-600 mb-2">
                                  {activity.details}
                                </p>
                              )}

                              <div className="flex items-center gap-2">
                                <Calendar className="w-3 h-3 text-gray-400" />
                                <span className="text-xs text-gray-500">
                                  {getTimeAgo(activity.timestamp)}
                                </span>
                                {activity.projectId && (
                                  <>
                                    <span className="text-xs text-gray-400">
                                      •
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      Project: {activity.projectId}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1 ml-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    {index < filteredActivities.length - 1 && <Separator />}
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No activities found</p>
                <p className="text-sm text-gray-400 mt-1">
                  Try adjusting your filters or check back later
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
