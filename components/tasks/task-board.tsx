"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Search,
  Filter,
  Calendar,
  MessageSquare,
  Paperclip,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Kanban,
  List,
  CalendarDays,
} from "lucide-react";
import { CreateTaskForm } from "./create-task-form";
import { TaskDetail } from "./task-detail";
import { useAuth } from "@/lib/auth/auth-context";

// Real tasks data from Convex

const statusColumns: { status: TaskStatus; title: string; color: string }[] = [
  { status: "todo", title: "To Do", color: "bg-gray-100" },
  { status: "in_progress", title: "In Progress", color: "bg-blue-100" },
  { status: "review", title: "Review", color: "bg-yellow-100" },
  { status: "done", title: "Done", color: "bg-green-100" },
];

const priorityColors: Record<TaskPriority, string> = {
  low: "bg-gray-100 text-gray-800",
  medium: "bg-blue-100 text-blue-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
};

interface TaskBoardProps {
  projectId?: string;
}

export function TaskBoard({ projectId }: TaskBoardProps) {
  const { user } = useAuth();

  // Fetch tasks from Convex
  const tasks =
    useQuery(api.tasks.getTasks, projectId ? { projectId } : {}) || [];

  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.tags?.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesPriority =
      priorityFilter === "all" || task.priority === priorityFilter;
    const matchesAssignee =
      assigneeFilter === "all" || task.assignee?.id === assigneeFilter;

    return matchesSearch && matchesPriority && matchesAssignee;
  });

  const canCreateTask =
    user?.role === "admin" || user?.role === "project_manager";

  const formatDeadline = (deadline: Date) => {
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: "Overdue", color: "text-red-600" };
    if (diffDays === 0) return { text: "Due today", color: "text-orange-600" };
    if (diffDays <= 3)
      return { text: `${diffDays}d left`, color: "text-yellow-600" };
    return { text: `${diffDays}d left`, color: "text-gray-600" };
  };

  // List View Component
  const TaskListView = () => (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Task</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Assignee</TableHead>
            <TableHead>Deadline</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredTasks.map((task) => {
            const deadline = task.deadline
              ? formatDeadline(task.deadline)
              : null;

            return (
              <TableRow
                key={task.id}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => setSelectedTask(task.id)}
              >
                <TableCell>
                  <div>
                    <p className="font-medium">{task.title}</p>
                    {task.description && (
                      <p className="text-sm text-gray-600 line-clamp-1">
                        {task.description}
                      </p>
                    )}
                    {task.tags && task.tags.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {task.tags.slice(0, 3).map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    className={
                      task.status === "done"
                        ? "bg-green-100 text-green-800"
                        : task.status === "in_progress"
                        ? "bg-blue-100 text-blue-800"
                        : task.status === "review"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                    }
                    variant="secondary"
                  >
                    {task.status.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    className={priorityColors[task.priority]}
                    variant="secondary"
                  >
                    {task.priority}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {task.assignee && (
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="text-xs">
                          {task.assignee.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <span className="text-sm">
                      {task.assignee?.name || "Unassigned"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {deadline && (
                    <span className={`text-sm ${deadline.color}`}>
                      {deadline.text}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      asChild
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTask(task.id);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      {canCreateTask && (
                        <>
                          <DropdownMenuItem
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Task
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Task
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );

  // Calendar View Component
  const TaskCalendarView = () => (
    <div className="space-y-4">
      <div className="text-center py-8">
        <CalendarDays className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Calendar View</h3>
        <p className="text-gray-600">
          Calendar view will be implemented with a date picker component.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Tasks with deadlines will be displayed on their respective dates.
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Task Board</h1>
          <p className="text-gray-600 mt-2">
            Manage tasks with multiple view options.
          </p>
        </div>

        {canCreateTask && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
              </DialogHeader>
              <CreateTaskForm
                projectId={projectId}
                onSuccess={() => setIsCreateOpen(false)}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select
          value={priorityFilter}
          onValueChange={(value) =>
            setPriorityFilter(value as TaskPriority | "all")
          }
        >
          <SelectTrigger className="w-40">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>

        <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Assignees" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Assignees</SelectItem>
            {tasks
              .filter((task) => task.assignee)
              .map((task) => task.assignee!)
              .filter(
                (assignee, index, arr) =>
                  arr.findIndex((a) => a.id === assignee.id) === index
              )
              .map((assignee) => (
                <SelectItem key={assignee.id} value={assignee.id}>
                  {assignee.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {/* View Tabs */}
      <Tabs defaultValue="kanban" className="space-y-6">
        <TabsList>
          <TabsTrigger value="kanban" className="gap-2">
            <Kanban className="w-4 h-4" />
            Kanban
          </TabsTrigger>
          <TabsTrigger value="list" className="gap-2">
            <List className="w-4 h-4" />
            List
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-2">
            <CalendarDays className="w-4 h-4" />
            Calendar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="kanban">
          {/* Kanban Board */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statusColumns.map((column) => {
              const columnTasks = filteredTasks.filter(
                (task) => task.status === column.status
              );

              return (
                <div key={column.status} className="space-y-4">
                  <div className={`p-3 rounded-lg ${column.color}`}>
                    <h3 className="font-semibold text-gray-900">
                      {column.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {columnTasks.length} tasks
                    </p>
                  </div>

                  <div className="space-y-3 min-h-[400px]">
                    {columnTasks.map((task) => {
                      const deadline = task.deadline
                        ? formatDeadline(task.deadline)
                        : null;

                      return (
                        <Card
                          key={task.id}
                          className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => setSelectedTask(task.id)}
                        >
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between">
                              <Badge
                                className={priorityColors[task.priority]}
                                variant="secondary"
                              >
                                {task.priority}
                              </Badge>

                              <DropdownMenu>
                                <DropdownMenuTrigger
                                  asChild
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedTask(task.id);
                                    }}
                                  >
                                    <Eye className="w-4 h-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  {canCreateTask && (
                                    <>
                                      <DropdownMenuItem
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <Edit className="w-4 h-4 mr-2" />
                                        Edit Task
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete Task
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            <CardTitle className="text-sm font-medium leading-tight">
                              {task.title}
                            </CardTitle>
                          </CardHeader>

                          <CardContent className="pt-0 space-y-3">
                            {task.description && (
                              <p className="text-xs text-gray-600 line-clamp-2">
                                {task.description}
                              </p>
                            )}

                            {/* Tags */}
                            {task.tags && task.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {task.tags.slice(0, 2).map((tag) => (
                                  <Badge
                                    key={tag}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                                {task.tags.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{task.tags.length - 2}
                                  </Badge>
                                )}
                              </div>
                            )}

                            {/* Assignees */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                {task.assignee && (
                                  <Avatar className="w-6 h-6">
                                    <AvatarFallback className="text-xs">
                                      {task.assignee.name
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")}
                                    </AvatarFallback>
                                  </Avatar>
                                )}
                              </div>

                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <div className="flex items-center gap-1">
                                  <MessageSquare className="w-3 h-3" />
                                  <span>0</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Paperclip className="w-3 h-3" />
                                  <span>{task.attachments?.length || 0}</span>
                                </div>
                              </div>
                            </div>

                            {/* Deadline */}
                            {deadline && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-gray-400" />
                                <span className={`text-xs ${deadline.color}`}>
                                  {deadline.text}
                                </span>
                              </div>
                            )}

                            {/* Status change will be handled via mutations */}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="list">
          <TaskListView />
        </TabsContent>

        <TabsContent value="calendar">
          <TaskCalendarView />
        </TabsContent>
      </Tabs>

      {/* Task Detail Modal */}
      {selectedTask && (
        <Dialog
          open={!!selectedTask}
          onOpenChange={() => setSelectedTask(null)}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <TaskDetail
              taskId={selectedTask}
              onClose={() => setSelectedTask(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
