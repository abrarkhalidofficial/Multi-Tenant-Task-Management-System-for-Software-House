"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Activity, FileText, MessageSquare, User, FolderOpen } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface ActivityFeedProps {
  entityType?: "project" | "task" | "comment" | "user"
  entityId?: string
  limit?: number
  showTitle?: boolean
}

export function ActivityFeed({ entityType, entityId, limit = 20, showTitle = true }: ActivityFeedProps) {
  const activities = useQuery(api.activityLogs.getActivityLogsByEntity, { entityType, entityId, limit })
  const recentActivities = useQuery(api.activityLogs.getRecentActivity, { limit })

  const getActivityIcon = (entityType: string, action: string) => {
    switch (entityType) {
      case "project":
        return <FolderOpen className="h-4 w-4" />
      case "task":
        return <FileText className="h-4 w-4" />
      case "comment":
        return <MessageSquare className="h-4 w-4" />
      case "user":
        return <User className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const getActivityColor = (action: string) => {
    switch (action) {
      case "created":
        return "bg-green-100 text-green-800"
      case "updated":
        return "bg-blue-100 text-blue-800"
      case "deleted":
        return "bg-red-100 text-red-800"
      case "assigned":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatActivityMessage = (activity: any) => {
    const entityName = activity.entityType
    const action = activity.action
    const userName = activity.user?.name || "Unknown User"

    if (activity.details?.field) {
      return `${userName} ${action} ${entityName} ${activity.details.field} from "${activity.details.oldValue}" to "${activity.details.newValue}"`
    }

    return `${userName} ${action} ${entityName}`
  }

  const displayedActivities = entityType && entityId ? activities : recentActivities

  if (!displayedActivities) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      {showTitle && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>
            {entityType && entityId ? "Activity for this item" : "Latest updates across your workspace"}
          </CardDescription>
        </CardHeader>
      )}
      <CardContent>
        <ScrollArea className="h-96">
          {displayedActivities.length > 0 ? (
            <div className="space-y-4">
              {displayedActivities.map((activity) => (
                <div key={activity._id} className="flex items-start space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {activity.user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      {getActivityIcon(activity.entityType, activity.action)}
                      <Badge className={getActivityColor(activity.action)} variant="secondary">
                        {activity.action}
                      </Badge>
                    </div>
                    <p className="text-sm">{formatActivityMessage(activity)}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="mx-auto h-12 w-12 mb-4" />
              <p>No activity yet</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
