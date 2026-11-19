"use client"

import { useConvexAuth, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Navbar } from "@/components/layout/navbar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AnalyticsOverview } from "@/components/analytics/analytics-overview"
import { TeamAnalytics } from "@/components/analytics/team-analytics"
import { TimeAnalytics } from "@/components/analytics/time-analytics"
import { redirect } from "next/navigation"
import { useEffect } from "react"

export default function AnalyticsPage() {
  const { isAuthenticated, isLoading } = useConvexAuth()
  const currentUser = useQuery(api.users.getCurrentUser)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      redirect("/auth")
    }
  }, [isAuthenticated, isLoading])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isAuthenticated || !currentUser) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Insights and metrics for your projects and team performance.</p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="team">Team Performance</TabsTrigger>
            <TabsTrigger value="time">Time Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <AnalyticsOverview />
          </TabsContent>

          <TabsContent value="team" className="space-y-6">
            <TeamAnalytics />
          </TabsContent>

          <TabsContent value="time" className="space-y-6">
            <TimeAnalytics />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
