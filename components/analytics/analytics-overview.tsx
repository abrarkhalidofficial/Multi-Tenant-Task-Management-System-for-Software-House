"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Minus, Target, Clock, AlertTriangle } from "lucide-react"

export function AnalyticsOverview() {
  const analytics = useQuery(api.analytics.getProjectAnalytics, {})
  const productivity = useQuery(api.analytics.getProductivityMetrics)

  if (!analytics || !productivity) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "up":
        return "text-green-600"
      case "down":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.completionRate}%</div>
            <Progress value={analytics.overview.completionRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {analytics.overview.completedTasks} of {analytics.overview.totalTasks} tasks completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Velocity</CardTitle>
            <div className="flex items-center space-x-1">{getTrendIcon(productivity.velocity.trend)}</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productivity.velocity.last7Days}</div>
            <p className="text-xs text-muted-foreground">tasks/day (7-day avg)</p>
            <p className={`text-xs mt-1 ${getTrendColor(productivity.velocity.trend)}`}>
              30-day avg: {productivity.velocity.last30Days}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cycle Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productivity.cycleTime.avgDays}d</div>
            <p className="text-xs text-muted-foreground">average completion time</p>
            <p className="text-xs text-muted-foreground mt-1">{productivity.cycleTime.avgHours}h total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{analytics.overview.overdueTasks}</div>
            <p className="text-xs text-muted-foreground">tasks past due date</p>
            {analytics.overview.overdueTasks > 0 && (
              <Badge variant="destructive" className="mt-2">
                Needs Attention
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status Distribution */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Task Status Distribution</CardTitle>
            <CardDescription>Current status of all tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analytics.distributions.status).map(([status, count]) => {
                const percentage = analytics.overview.totalTasks > 0 ? (count / analytics.overview.totalTasks) * 100 : 0
                const statusColors = {
                  todo: "bg-gray-500",
                  in_progress: "bg-blue-500",
                  review: "bg-yellow-500",
                  done: "bg-green-500",
                }

                return (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${statusColors[status as keyof typeof statusColors]}`} />
                      <span className="text-sm capitalize">{status.replace("_", " ")}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">{count}</span>
                      <span className="text-xs text-muted-foreground">({Math.round(percentage)}%)</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Priority Distribution</CardTitle>
            <CardDescription>Tasks by priority level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analytics.distributions.priority).map(([priority, count]) => {
                const percentage = analytics.overview.totalTasks > 0 ? (count / analytics.overview.totalTasks) * 100 : 0
                const priorityColors = {
                  low: "bg-green-500",
                  medium: "bg-yellow-500",
                  high: "bg-orange-500",
                  urgent: "bg-red-500",
                }

                return (
                  <div key={priority} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-3 h-3 rounded-full ${priorityColors[priority as keyof typeof priorityColors]}`}
                      />
                      <span className="text-sm capitalize">{priority}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">{count}</span>
                      <span className="text-xs text-muted-foreground">({Math.round(percentage)}%)</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
