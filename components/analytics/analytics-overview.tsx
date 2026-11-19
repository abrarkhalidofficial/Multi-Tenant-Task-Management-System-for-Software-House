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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  TrendingUp,
  Users,
  CheckSquare,
  Calendar,
  Target,
  Clock,
  AlertTriangle,
  Download,
  Filter,
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";

// Mock analytics data
const mockAnalyticsData = {
  overview: {
    totalProjects: 12,
    activeProjects: 8,
    completedProjects: 4,
    totalTasks: 156,
    completedTasks: 89,
    inProgressTasks: 45,
    overdueTasks: 12,
    teamMembers: 15,
    avgCompletionTime: 4.2, // days
    onTimeDeliveryRate: 78, // percentage
  },
  projectAnalytics: [
    {
      id: "proj_1",
      name: "E-commerce Platform",
      status: "active",
      progress: 75,
      tasksCompleted: 18,
      totalTasks: 24,
      teamSize: 5,
      startDate: new Date("2024-01-01"),
      deadline: new Date("2024-03-15"),
      budget: 50000,
      spent: 37500,
      efficiency: 85,
    },
    {
      id: "proj_2",
      name: "Mobile Banking App",
      status: "active",
      progress: 25,
      tasksCompleted: 2,
      totalTasks: 8,
      teamSize: 3,
      startDate: new Date("2024-02-01"),
      deadline: new Date("2024-04-30"),
      budget: 30000,
      spent: 7500,
      efficiency: 92,
    },
    {
      id: "proj_3",
      name: "CRM Integration",
      status: "completed",
      progress: 100,
      tasksCompleted: 15,
      totalTasks: 15,
      teamSize: 4,
      startDate: new Date("2023-11-01"),
      deadline: new Date("2024-02-01"),
      budget: 25000,
      spent: 24000,
      efficiency: 88,
    },
  ],
  teamAnalytics: [
    {
      id: "user_3",
      name: "Mike Johnson",
      role: "Team Lead",
      tasksCompleted: 12,
      tasksInProgress: 3,
      avgCompletionTime: 3.2,
      efficiency: 92,
      utilization: 85,
    },
    {
      id: "user_4",
      name: "Alex Chen",
      role: "Developer",
      tasksCompleted: 8,
      tasksInProgress: 2,
      avgCompletionTime: 4.1,
      efficiency: 88,
      utilization: 78,
    },
    {
      id: "user_5",
      name: "Emma Davis",
      role: "Developer",
      tasksCompleted: 6,
      tasksInProgress: 4,
      avgCompletionTime: 5.3,
      efficiency: 85,
      utilization: 92,
    },
  ],
  timeAnalytics: {
    totalHoursLogged: 1247,
    avgHoursPerDay: 6.2,
    billableHours: 892,
    nonBillableHours: 355,
    overtimeHours: 89,
  },
  trends: {
    taskCompletion: [
      { month: "Jan", completed: 23, created: 28 },
      { month: "Feb", completed: 31, created: 25 },
      { month: "Mar", completed: 28, created: 32 },
      { month: "Apr", completed: 35, created: 30 },
      { month: "May", completed: 29, created: 27 },
      { month: "Jun", completed: 32, created: 31 },
    ],
    projectVelocity: [
      { week: "W1", velocity: 15 },
      { week: "W2", velocity: 18 },
      { week: "W3", velocity: 12 },
      { week: "W4", velocity: 22 },
      { week: "W5", velocity: 16 },
      { week: "W6", velocity: 19 },
    ],
  },
};

export function AnalyticsOverview() {
  const { user, tenant } = useAuth();
  const [timeRange, setTimeRange] = useState("30d");
  const [selectedProject, setSelectedProject] = useState("all");

  const getDaysUntilDeadline = (deadline: Date) => {
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "active":
        return "bg-blue-100 text-blue-800";
      case "on_hold":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-gray-900">
            Analytics & Reports
          </h1>
          <p className="text-gray-600">
            Track performance and generate insights for {tenant?.name}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">
                  Project Completion Rate
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {Math.round(
                    (mockAnalyticsData.overview.completedProjects /
                      mockAnalyticsData.overview.totalProjects) *
                      100
                  )}
                  %
                </p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <Target className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-3">
              {mockAnalyticsData.overview.completedProjects} of{" "}
              {mockAnalyticsData.overview.totalProjects} projects completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">
                  Task Completion Rate
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {Math.round(
                    (mockAnalyticsData.overview.completedTasks /
                      mockAnalyticsData.overview.totalTasks) *
                      100
                  )}
                  %
                </p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <CheckSquare className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-3">
              {mockAnalyticsData.overview.completedTasks} of{" "}
              {mockAnalyticsData.overview.totalTasks} tasks completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">
                  On-Time Delivery
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {mockAnalyticsData.overview.onTimeDeliveryRate}%
                </p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-3">
              Average completion time:{" "}
              {mockAnalyticsData.overview.avgCompletionTime} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">
                  Team Utilization
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {Math.round(
                    (mockAnalyticsData.timeAnalytics.totalHoursLogged /
                      (mockAnalyticsData.overview.teamMembers * 8 * 30)) *
                      100
                  )}
                  %
                </p>
              </div>
              <div className="p-2 bg-orange-100 rounded-lg">
                <Users className="w-5 h-5 text-orange-600" />
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-3">
              {mockAnalyticsData.timeAnalytics.totalHoursLogged} hours logged
              this month
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="projects" className="space-y-6">
        <TabsList>
          <TabsTrigger value="projects">Project Analytics</TabsTrigger>
          <TabsTrigger value="team">Team Performance</TabsTrigger>
          <TabsTrigger value="time">Time Tracking</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Performance</CardTitle>
              <CardDescription>
                Detailed analytics for all projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {mockAnalyticsData.projectAnalytics.map((project) => {
                  const daysLeft = getDaysUntilDeadline(project.deadline);
                  const isOverdue = daysLeft < 0;

                  return (
                    <div
                      key={project.id}
                      className="p-4 border rounded-lg space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {project.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              className={getStatusColor(project.status)}
                              variant="secondary"
                            >
                              {project.status}
                            </Badge>
                            <span className="text-sm text-gray-600">
                              {project.teamSize} members •{" "}
                              {project.tasksCompleted}/{project.totalTasks}{" "}
                              tasks
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {project.progress}% complete
                          </p>
                          <p
                            className={`text-sm ${
                              isOverdue
                                ? "text-red-600"
                                : daysLeft <= 7
                                ? "text-orange-600"
                                : "text-gray-600"
                            }`}
                          >
                            {isOverdue
                              ? `${Math.abs(daysLeft)} days overdue`
                              : `${daysLeft} days left`}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Progress</p>
                          <Progress value={project.progress} className="mt-1" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Budget Used</p>
                          <p className="font-medium">
                            ${project.spent.toLocaleString()} / $
                            {project.budget.toLocaleString()}
                          </p>
                          <Progress
                            value={(project.spent / project.budget) * 100}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Efficiency</p>
                          <p className="font-medium">{project.efficiency}%</p>
                          <Progress
                            value={project.efficiency}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Performance Metrics</CardTitle>
              <CardDescription>
                Individual and team productivity analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockAnalyticsData.teamAnalytics.map((member) => (
                  <div key={member.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {member.name}
                        </h4>
                        <p className="text-sm text-gray-600">{member.role}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          Efficiency: {member.efficiency}%
                        </p>
                        <p className="text-sm text-gray-600">
                          Utilization: {member.utilization}%
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Tasks Completed</p>
                        <p className="font-medium">{member.tasksCompleted}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">In Progress</p>
                        <p className="font-medium">{member.tasksInProgress}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">
                          Avg. Completion Time
                        </p>
                        <p className="font-medium">
                          {member.avgCompletionTime} days
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Utilization</p>
                        <Progress value={member.utilization} className="mt-1" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="time" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-600">
                      Total Hours Logged
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                      {mockAnalyticsData.timeAnalytics.totalHoursLogged}
                    </p>
                  </div>
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-3">
                  Avg {mockAnalyticsData.timeAnalytics.avgHoursPerDay} hours/day
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-600">
                      Billable Hours
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                      {mockAnalyticsData.timeAnalytics.billableHours}
                    </p>
                  </div>
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-3">
                  {Math.round(
                    (mockAnalyticsData.timeAnalytics.billableHours /
                      mockAnalyticsData.timeAnalytics.totalHoursLogged) *
                      100
                  )}
                  % of total time
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-600">
                      Overtime Hours
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                      {mockAnalyticsData.timeAnalytics.overtimeHours}
                    </p>
                  </div>
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-3">This month</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-600">
                      Avg. Daily Hours
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                      {mockAnalyticsData.timeAnalytics.avgHoursPerDay}
                    </p>
                  </div>
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-3">Per team member</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Task Completion Trends</CardTitle>
                <CardDescription>
                  Monthly task creation vs completion
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockAnalyticsData.trends.taskCompletion.map((month) => (
                    <div
                      key={month.month}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm font-medium">{month.month}</span>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-green-600">
                            +{month.completed}
                          </p>
                          <p className="text-xs text-gray-500">completed</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-blue-600">
                            +{month.created}
                          </p>
                          <p className="text-xs text-gray-500">created</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Project Velocity</CardTitle>
                <CardDescription>Tasks completed per week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockAnalyticsData.trends.projectVelocity.map((week) => (
                    <div
                      key={week.week}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm font-medium">{week.week}</span>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={(week.velocity / 25) * 100}
                          className="w-24"
                        />
                        <span className="text-sm font-medium">
                          {week.velocity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
