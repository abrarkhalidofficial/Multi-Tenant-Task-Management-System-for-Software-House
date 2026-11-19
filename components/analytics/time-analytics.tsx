"use client"

import { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, BarChart3, TrendingUp } from "lucide-react"
import { format, subDays } from "date-fns"
import { cn } from "@/lib/utils"

export function TimeAnalytics() {
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date(),
  })

  const timeAnalytics = useQuery(api.analytics.getTimeAnalytics, {
    startDate: dateRange.from.getTime(),
    endDate: dateRange.to.getTime(),
  })

  if (!timeAnalytics) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    )
  }

  const chartData = Object.entries(timeAnalytics.tasksByDay).map(([date, created]) => ({
    date,
    created,
    completed: timeAnalytics.completedTasksByDay[date] || 0,
    activities: timeAnalytics.activitiesByDay[date] || 0,
  }))

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Time-based Analytics</CardTitle>
              <CardDescription>Task creation and completion trends over time</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("justify-start text-left font-normal")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      "Pick a date range"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={dateRange}
                    onSelect={(range) => {
                      if (range?.from && range?.to) {
                        setDateRange({ from: range.from, to: range.to })
                      }
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Created</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{timeAnalytics.totalTasksCreated}</div>
            <p className="text-xs text-muted-foreground">in selected period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.values(timeAnalytics.completedTasksByDay).reduce((sum, count) => sum + count, 0)}
            </div>
            <p className="text-xs text-muted-foreground">in selected period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{timeAnalytics.totalActivities}</div>
            <p className="text-xs text-muted-foreground">team activities</p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Activity Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Activity</CardTitle>
          <CardDescription>Task creation and completion by day</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {chartData.length > 0 ? (
              chartData.slice(-14).map((day) => (
                <div key={day.date} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="font-medium">{format(new Date(day.date), "MMM dd")}</div>
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <div className="text-sm font-medium text-blue-600">{day.created}</div>
                      <div className="text-xs text-muted-foreground">Created</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium text-green-600">{day.completed}</div>
                      <div className="text-xs text-muted-foreground">Completed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium text-purple-600">{day.activities}</div>
                      <div className="text-xs text-muted-foreground">Activities</div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="mx-auto h-12 w-12 mb-4" />
                <p>No data available for selected period</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
