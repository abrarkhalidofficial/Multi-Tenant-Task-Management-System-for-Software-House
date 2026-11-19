"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-convex-auth";
import { useMyTasks } from "@/hooks/use-tasks";
import { useUsers } from "@/hooks/use-users";
import { useTaskStats } from "@/hooks/use-tasks";
import {
  CheckCircle,
  Clock,
  Zap,
  BarChart3,
  Edit3,
  Users,
  MessageSquare,
  ChevronDown,
  Calendar,
  Plus,
  Share,
} from "lucide-react";

export default function MyTasksPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [selectedTimePeriod, setSelectedTimePeriod] = useState("This Week");
  const [selectedDate, setSelectedDate] = useState(17);
  const [currentWeekStart, setCurrentWeekStart] = useState(15);

  // Fetch real data from backend
  const { myTasks, isLoading: tasksLoading } = useMyTasks({
    status: selectedTimePeriod === "This Week" ? undefined : undefined,
  });

  const { users } = useUsers();
  const { stats } = useTaskStats();

  if (!isAuthenticated) {
    router.push("/login");
    return null;
  }

  if (tasksLoading) {
    return <div className="p-6">Loading tasks...</div>;
  }

  // Transform backend data to match frontend structure
  const tasks = {
    "This Week":
      myTasks?.filter((task: any) => {
        const taskDate = new Date(task.createdAt);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return taskDate >= weekAgo;
      }) || [],
    "Last Week":
      myTasks?.filter((task: any) => {
        const taskDate = new Date(task.createdAt);
        const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return taskDate >= twoWeeksAgo && taskDate < oneWeekAgo;
      }) || [],
    "This Month":
      myTasks?.filter((task: any) => {
        const taskDate = new Date(task.createdAt);
        const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        return taskDate >= monthAgo;
      }) || [],
  };

  const currentTasks = tasks[selectedTimePeriod as keyof typeof tasks] || [];

  const getCurrentWeekDays = () => {
    const days = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
    return days.map((day, index) => ({
      day,
      date: currentWeekStart + index,
    }));
  };

  const navigateWeek = (direction: "prev" | "next") => {
    setCurrentWeekStart((prev) => (direction === "next" ? prev + 7 : prev - 7));
  };

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case "todo":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
      case "in_progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "review":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "done":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
      case "medium":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "high":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      case "urgent":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const handleChangeAssignee = (taskId: string, newAssigneeId: string) => {
    // This would be implemented with a mutation
    console.log("Changing assignee for task", taskId, "to", newAssigneeId);
  };

  return (
    <div className="p-6">
      {/* Welcome Section */}
      <div className="mb-6">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Good{" "}
          {new Date().getHours() < 12
            ? "Morning"
            : new Date().getHours() < 18
            ? "Afternoon"
            : "Evening"}
          ! {user?.name},
        </h2>

        <div className="flex items-center space-x-6 mb-6">
          <Button
            variant="outline"
            size="sm"
            className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 bg-transparent"
          >
            <Share className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 bg-transparent"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
        </div>

        {/* Stats */}
        <div className="flex items-center space-x-8 mb-8">
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
            <span className="font-semibold text-gray-900 dark:text-white">
              {stats?.avgCompletionTime || 0}hrs
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
              Avg Completion Time
            </span>
          </div>
          <div className="flex items-center">
            <CheckCircle className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
            <span className="font-semibold text-gray-900 dark:text-white">
              {stats?.total || 0}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
              Total Tasks
            </span>
          </div>
          <div className="flex items-center">
            <Zap className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
            <span className="font-semibold text-gray-900 dark:text-white">
              {stats?.completionRate || 0}%
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
              Completion Rate
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-y-6">
        {/* My Projects - Full Width */}
        <div className="lg:col-span-3">
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center text-gray-900 dark:text-white">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  My Tasks
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-transparent"
                      >
                        {selectedTimePeriod}
                        <ChevronDown className="w-4 h-4 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                      <DropdownMenuItem
                        onClick={() => setSelectedTimePeriod("This Week")}
                        className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        This Week
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setSelectedTimePeriod("Last Week")}
                        className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Last Week
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setSelectedTimePeriod("This Month")}
                        className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        This Month
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-600 dark:text-gray-300"
                  >
                    See All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 pb-2">
                  <div className="col-span-6 flex items-center">
                    <Edit3 className="w-4 h-4 mr-2" />
                    Task Name
                  </div>
                  <div className="col-span-3 flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    Assignee
                  </div>
                  <div className="col-span-3 flex items-center">
                    <Zap className="w-4 h-4 mr-2" />
                    Status
                  </div>
                </div>

                {/* Task Rows */}
                {currentTasks.map((task: any) => {
                  const assignee = task.assignees?.[0] || users?.[0];
                  return (
                    <div
                      key={task.id}
                      className="grid grid-cols-12 gap-4 items-center py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                    >
                      <div className="col-span-6">
                        <div className="flex items-center">
                          <CheckCircle className="w-4 h-4 mr-3 text-gray-400 dark:text-gray-500" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {task.name}
                          </span>
                          <div className="flex items-center ml-4 space-x-2">
                            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                              <MessageSquare className="w-3 h-3 mr-1" />
                              {task.comments?.length || 0}
                            </span>
                            <Badge className={getPriorityColor(task.priority)}>
                              {task.priority}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="col-span-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <div className="flex items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded p-1">
                              <Avatar className="w-6 h-6 mr-2">
                                <AvatarImage
                                  src={assignee?.avatar || "/placeholder.svg"}
                                />
                                <AvatarFallback className="bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white">
                                  {assignee?.name
                                    ?.split(" ")
                                    .map((n: string) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {assignee?.name}
                              </span>
                              <ChevronDown className="w-3 h-3 ml-1" />
                            </div>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                            {users?.map((person: any) => (
                              <DropdownMenuItem
                                key={person.id}
                                onClick={() =>
                                  handleChangeAssignee(task.id, person.id)
                                }
                                className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                <Avatar className="w-5 h-5 mr-2">
                                  <AvatarImage
                                    src={person.avatar || "/placeholder.svg"}
                                  />
                                  <AvatarFallback className="bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white">
                                    {person.name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                  <span className="text-sm">{person.name}</span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {person.email}
                                  </span>
                                </div>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="col-span-3">
                        <Badge className={getTaskStatusColor(task.status)}>
                          {task.status}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
