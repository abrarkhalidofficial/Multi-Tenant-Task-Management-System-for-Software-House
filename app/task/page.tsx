"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus,
  Search,
  Calendar,
  User,
  AlertCircle,
  Clock,
  Edit,
  Trash2,
  X,
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/lib/auth/auth-context";

interface Task {
  _id: Id<"tasks">;
  title: string;
  description: string;
  status: "todo" | "in-progress" | "done";
  priority: "low" | "medium" | "high";
  label: string;
  assignee: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}

interface Column {
  _id: Id<"columns">;
  title: string;
  taskIds: Id<"tasks">[];
}

interface Board {
  id: Id<"boards">;
  name: string;
  columns: Column[];
  tasks: Task[];
}

interface ActivityItem {
  id: Id<"activity">;
  type: "created" | "updated" | "moved" | "deleted";
  taskId: Id<"tasks">;
  taskTitle: string;
  details: string;
  timestamp: string;
}

interface Filters {
  search: string;
  priority: string;
  label: string;
  assignee: string;
  status: string;
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "high":
      return "bg-red-100 text-red-800 border-red-200";
    case "medium":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "low":
      return "bg-green-100 text-green-800 border-green-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const getLabelColor = (label: string) => {
  const colors = {
    Design: "bg-purple-100 text-purple-800 border-purple-200",
    Backend: "bg-blue-100 text-blue-800 border-blue-200",
    Frontend: "bg-cyan-100 text-cyan-800 border-cyan-200",
    Planning: "bg-orange-100 text-orange-800 border-orange-200",
    Testing: "bg-pink-100 text-pink-800 border-pink-200",
  };
  return (
    colors[label as keyof typeof colors] ||
    "bg-gray-100 text-gray-800 border-gray-200"
  );
};

interface DraggableTaskProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: Id<"tasks">) => void;
}

const DraggableTask: React.FC<DraggableTaskProps> = ({
  task,
  onEdit,
  onDelete,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    setIsDragging(true);
    e.dataTransfer.setData("text/plain", task._id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const isOverdue =
    new Date(task.dueDate) < new Date() && task.status !== "done";

  return (
    <Card
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`mb-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-all duration-200 ${
        isDragging ? "opacity-50 scale-105 rotate-2" : ""
      }`}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-medium text-sm">{task.title}</h4>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.stopPropagation();
                onEdit(task);
              }}
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.stopPropagation();
                onDelete(task._id);
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {task.description && (
          <p className="text-xs text-gray-600 mb-3 line-clamp-2">
            {task.description}
          </p>
        )}

        <div className="flex flex-wrap gap-1 mb-3">
          <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
            {task.priority}
          </Badge>
          {task.label && (
            <Badge className={`text-xs ${getLabelColor(task.label)}`}>
              {task.label}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-2">
            {task.assignee && (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>{task.assignee.split(" ")[0]}</span>
              </div>
            )}
          </div>
          {task.dueDate && (
            <div
              className={`flex items-center gap-1 ${
                isOverdue ? "text-red-500" : ""
              }`}
            >
              <Calendar className="h-3 w-3" />
              <span>
                {new Date(task.dueDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              {isOverdue && <AlertCircle className="h-3 w-3" />}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

interface DroppableColumnProps {
  column: Column;
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: Id<"tasks">) => void;
}

const DroppableColumn: React.FC<DroppableColumnProps> = ({
  column,
  tasks,
  onEdit,
  onDelete,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    const taskId = e.dataTransfer.getData("text/plain");
    if (taskId) {
      // Emit custom event with task ID and column ID
      const dropEvent = new CustomEvent("taskDropped", {
        detail: { taskId, columnId: column._id },
      });
      window.dispatchEvent(dropEvent);
    }
  };

  return (
    <div className="min-w-80 w-80">
      <Card
        className={`h-full transition-all duration-200 ${
          isDragOver ? "ring-2 ring-blue-500 ring-opacity-50" : ""
        }`}
      >
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="text-lg font-semibold">{column.title}</span>
            <Badge variant="secondary" className="text-xs">
              {tasks.length > 0 ? tasks.length : "No tasks"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="min-h-[400px] transition-colors"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {tasks.length > 0 ? (
              tasks.map((task) => (
                <DraggableTask
                  key={task._id}
                  task={task}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))
            ) : (
              <div className="text-center text-gray-400 py-8">
                <p>No tasks</p>
                <p className="text-xs mt-1">Drag tasks here or add new ones</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface TaskFormProps {
  task?: Task | null;
  onSave: (task: Omit<Task, "_id" | "createdAt" | "updatedAt">) => void;
  onCancel: () => void;
}

const TaskForm: React.FC<TaskFormProps> = ({ task, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: task?.title || "",
    description: task?.description || "",
    status: task?.status || "todo",
    priority: task?.priority || "medium",
    label: task?.label || "",
    assignee: task?.assignee || "",
    dueDate: task?.dueDate || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value: Task["status"]) =>
              setFormData({ ...formData, status: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="done">Done</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="priority">Priority</Label>
          <Select
            value={formData.priority}
            onValueChange={(value: Task["priority"]) =>
              setFormData({ ...formData, priority: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="label">Label</Label>
          <Select
            value={formData.label}
            onValueChange={(value: string) =>
              setFormData({ ...formData, label: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select label" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Design">Design</SelectItem>
              <SelectItem value="Frontend">Frontend</SelectItem>
              <SelectItem value="Backend">Backend</SelectItem>
              <SelectItem value="Planning">Planning</SelectItem>
              <SelectItem value="Testing">Testing</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="assignee">Assignee</Label>
          <Input
            id="assignee"
            value={formData.assignee}
            onChange={(e) =>
              setFormData({ ...formData, assignee: e.target.value })
            }
            placeholder="Enter assignee name"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="dueDate">Due Date</Label>
        <Input
          id="dueDate"
          type="date"
          value={formData.dueDate}
          onChange={(e) =>
            setFormData({ ...formData, dueDate: e.target.value })
          }
        />
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </DialogClose>
        <Button type="submit">{task ? "Update Task" : "Create Task"}</Button>
      </DialogFooter>
    </form>
  );
};

export default function TaskManager() {
  const [filters, setFilters] = useState<Filters>({
    search: "",
    priority: "",
    label: "",
    assignee: "",
    status: "",
  });
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { tenant } = useAuth();
  const boardData = useQuery(
    api.boards.getBoardWithData,
    tenant ? { tenantId: tenant.id } : "skip"
  );
  const activityData = useQuery(
    api.activity.getActivity,
    tenant ? { tenantId: tenant.id } : "skip"
  );

  const createTask = useMutation(api.tasks.createTask);
  const updateTask = useMutation(api.tasks.updateTask);
  const deleteTask = useMutation(api.tasks.deleteTask);
  const moveTask = useMutation(api.tasks.moveTask);
  const createActivity = useMutation(api.activity.createActivity);

  const addActivity = async (
    type: "created" | "updated" | "moved" | "deleted",
    taskId: Id<"tasks">,
    taskTitle: string,
    details: string
  ) => {
    if (!tenant) return;
    await createActivity({
      tenantId: tenant.id,
      type,
      taskId,
      taskTitle,
      details,
      timestamp: new Date().toISOString(),
    });
  };

  const handleCreateTask = async (
    taskData: Omit<Task, "_id" | "createdAt" | "updatedAt">
  ) => {
    if (!boardData || !tenant) return;

    const statusToTitle = {
      todo: "To Do",
      "in-progress": "In Progress",
      done: "Done",
    };

    const columnTitle = statusToTitle[taskData.status];
    const targetColumn = boardData.columns.find(
      (col: Column) => col.title === columnTitle
    );

    if (!targetColumn) {
      console.error("Column not found for status:", taskData.status);
      return;
    }

    const newTaskId = await createTask({
      tenantId: tenant.id,
      ...taskData,
      boardId: boardData.id,
      columnId: targetColumn._id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await addActivity(
      "created",
      newTaskId,
      taskData.title,
      `Task created with priority: ${taskData.priority}`
    );
    setIsCreateDialogOpen(false);
  };

  const handleUpdateTask = async (
    taskData: Omit<Task, "_id" | "createdAt" | "updatedAt">
  ) => {
    if (!editingTask || !boardData) return;

    await updateTask({
      id: editingTask._id,
      ...taskData,
      updatedAt: new Date().toISOString(),
    });

    await addActivity(
      "updated",
      editingTask._id,
      editingTask.title,
      "Task details updated"
    );
    setEditingTask(null);
    setIsEditDialogOpen(false);
  };

  const handleDeleteTask = async (taskId: Id<"tasks">) => {
    if (!boardData) return;

    const task: Task | undefined = boardData.tasks.find(
      (t: Task) => t._id === taskId
    );
    if (!task) return;

    await deleteTask({ id: taskId });
    await addActivity("deleted", taskId, task.title, "Task deleted");
  };

  // Handle task drop events
  useEffect(() => {
    const handleTaskDrop = async (event: CustomEvent) => {
      const { taskId, columnId } = event.detail;
      if (!boardData || !tenant) return;

      const sourceColumn = boardData.columns.find((col: Column) =>
        col.taskIds.includes(taskId)
      );

      const destColumn = boardData.columns.find(
        (col: Column) => col._id === columnId
      );

      if (!sourceColumn || !destColumn || sourceColumn._id === destColumn._id)
        return;

      const task: Task | undefined = boardData.tasks.find(
        (t: Task) => t._id === taskId
      );
      if (!task) return;

      const titleToStatus = {
        "To Do": "todo",
        "In Progress": "in-progress",
        Done: "done",
      } as const;

      const newStatus =
        titleToStatus[destColumn.title as keyof typeof titleToStatus];

      if (!newStatus) {
        console.error("Invalid column title:", destColumn.title);
        return;
      }

      try {
        await moveTask({
          taskId,
          newColumnId: destColumn._id,
          newStatus,
        });

        await addActivity(
          "moved",
          taskId,
          task.title,
          `Moved from ${sourceColumn.title} to ${destColumn.title}`
        );
      } catch (error) {
        console.error("Error moving task:", error);
      }
    };

    window.addEventListener("taskDropped", handleTaskDrop as any);

    return () => {
      window.removeEventListener("taskDropped", handleTaskDrop as any);
    };
  }, [boardData, tenant, moveTask, addActivity]);

  const getFilteredTasks = (columnTasks: Task[]) => {
    return columnTasks.filter((task) => {
      const matchesSearch =
        !filters.search ||
        task.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        task.description.toLowerCase().includes(filters.search.toLowerCase());

      const matchesPriority =
        !filters.priority || task.priority === filters.priority;
      const matchesLabel = !filters.label || task.label === filters.label;
      const matchesAssignee =
        !filters.assignee ||
        task.assignee.toLowerCase().includes(filters.assignee.toLowerCase());
      const matchesStatus = !filters.status || task.status === filters.status;

      return (
        matchesSearch &&
        matchesPriority &&
        matchesLabel &&
        matchesAssignee &&
        matchesStatus
      );
    });
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      priority: "",
      label: "",
      assignee: "",
      status: "",
    });
  };

  if (!boardData) {
    return <div className="min-h-screen bg-gray-50 p-6">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {boardData.name}
              </h1>
              <p className="text-gray-600">
                Manage your tasks with drag & drop kanban board
              </p>
            </div>
            <div className="flex gap-2">
              <Dialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Task
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Task</DialogTitle>
                  </DialogHeader>
                  <TaskForm
                    onSave={handleCreateTask}
                    onCancel={() => setIsCreateDialogOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Filters & Search */}
          <Card className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2 min-w-64">
                <Search className="h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search tasks..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                />
              </div>

              <Select
                value={filters.priority}
                onValueChange={(value: string) =>
                  setFilters({ ...filters, priority: value })
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.label}
                onValueChange={(value: string) =>
                  setFilters({ ...filters, label: value })
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Label" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  <SelectItem value="Design">Design</SelectItem>
                  <SelectItem value="Frontend">Frontend</SelectItem>
                  <SelectItem value="Backend">Backend</SelectItem>
                  <SelectItem value="Planning">Planning</SelectItem>
                  <SelectItem value="Testing">Testing</SelectItem>
                </SelectContent>
              </Select>

              <Input
                placeholder="Assignee"
                className="w-32"
                value={filters.assignee}
                onChange={(e) =>
                  setFilters({ ...filters, assignee: e.target.value })
                }
              />

              {(filters.search ||
                filters.priority ||
                filters.label ||
                filters.assignee) && (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="board" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="board">Board</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="board">
            {/* Kanban Board */}
            <div className="flex gap-6 overflow-x-auto pb-4">
              {boardData.columns.map((column: Column) => {
                const columnTasks: Task[] = column.taskIds
                  .map((taskId: Id<"tasks">) =>
                    boardData.tasks.find((t: Task) => t._id === taskId)
                  )
                  .filter(Boolean) as Task[];
                const filteredTasks: Task[] = getFilteredTasks(columnTasks);

                return (
                  <DroppableColumn
                    key={column._id}
                    column={column}
                    tasks={filteredTasks}
                    onEdit={(task: Task) => {
                      setEditingTask(task);
                      setIsEditDialogOpen(true);
                    }}
                    onDelete={handleDeleteTask}
                  />
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="activity">
            {/* Activity Log */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Activity Log
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {!activityData || activityData.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">
                        No activity yet
                      </p>
                    ) : (
                      activityData.map((item) => (
                        <div key={item._id} className="flex gap-3 items-start">
                          <div
                            className={`rounded-full p-1 ${
                              item.type === "created"
                                ? "bg-green-100"
                                : item.type === "updated"
                                ? "bg-blue-100"
                                : item.type === "moved"
                                ? "bg-yellow-100"
                                : "bg-red-100"
                            }`}
                          >
                            {item.type === "created" && (
                              <Plus className="h-3 w-3 text-green-600" />
                            )}
                            {item.type === "updated" && (
                              <Edit className="h-3 w-3 text-blue-600" />
                            )}
                            {item.type === "moved" && (
                              <Plus className="h-3 w-3 text-yellow-600" />
                            )}
                            {item.type === "deleted" && (
                              <Trash2 className="h-3 w-3 text-red-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">
                              <span className="font-medium">
                                {item.taskTitle}
                              </span>{" "}
                              was {item.type}
                            </p>
                            <p className="text-xs text-gray-500">
                              {item.details}
                            </p>
                            <p className="text-xs text-gray-400">
                              {new Date(item.timestamp).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )}{" "}
                              at{" "}
                              {new Date(item.timestamp).toLocaleTimeString(
                                "en-US",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Task Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
            </DialogHeader>
            <TaskForm
              task={editingTask}
              onSave={handleUpdateTask}
              onCancel={() => {
                setEditingTask(null);
                setIsEditDialogOpen(false);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
