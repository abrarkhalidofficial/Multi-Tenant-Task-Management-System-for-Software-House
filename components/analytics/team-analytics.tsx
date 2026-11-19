"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Users, Trophy, Target } from "lucide-react"

export function TeamAnalytics() {
  const teamAnalytics = useQuery(api.analytics.getTeamAnalytics)

  if (!teamAnalytics) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    )
  }

  const topPerformer = teamAnalytics.userMetrics[0]
  const avgCompletionRate =
    teamAnalytics.userMetrics.reduce((sum, user) => sum + user.completionRate, 0) / teamAnalytics.userMetrics.length

  return (
    <div className="space-y-6">
      {/* Team Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Size</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamAnalytics.teamSize}</div>
            <p className="text-xs text-muted-foreground">active team members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Completion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(avgCompletionRate)}%</div>
            <Progress value={avgCompletionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Performer</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {topPerformer ? (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">{topPerformer.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{topPerformer.name}</span>
                </div>
                <div className="text-2xl font-bold">{topPerformer.completionRate}%</div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Team Member Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Team Performance</CardTitle>
          <CardDescription>Individual team member statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamAnalytics.userMetrics.map((user) => (
              <div key={user.userId} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <Badge variant="outline" className="mt-1">
                      {user.role.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <p className="text-sm font-medium">{user.totalTasks}</p>
                      <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-green-600">{user.completedTasks}</p>
                      <p className="text-xs text-muted-foreground">Completed</p>
                    </div>
                    {user.overdueTasks > 0 && (
                      <div className="text-center">
                        <p className="text-sm font-medium text-red-600">{user.overdueTasks}</p>
                        <p className="text-xs text-muted-foreground">Overdue</p>
                      </div>
                    )}
                    <div className="text-center min-w-[60px]">
                      <p className="text-sm font-medium">{user.completionRate}%</p>
                      <Progress value={user.completionRate} className="w-16 h-2" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
