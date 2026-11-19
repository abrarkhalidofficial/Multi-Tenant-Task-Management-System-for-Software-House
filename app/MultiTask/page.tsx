"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import {
  PlusCircle,
  Trash2,
  Edit,
  Calendar as CalendarIcon,
  List,
  LayoutGrid,
  TimerIcon,
} from "lucide-react";

// Types
interface Task {
  id: string;
  title: string;
  description: string;
  status: "todo" | "in-progress" | "review" | "done";
  priority: "low" | "medium" | "high";
  dueDate: Date;
  assignee: string;
  projectId: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
}

// Data service (simulating real-time data with API calls)
const useTasksData = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API fetch
    const fetchData = async () => {
      setLoading(true);
      try {
        // In a real app, this would be an API call
        await new Promise((resolve) => setTimeout(resolve, 500));

        // This would be replaced with actual API data in production
        const projectsData = [
          {
            id: "p1",
            name: "Website Redesign",
            description: "Redesign company website",
          },
          {
            id: "p2",
            name: "Mobile App",
            description: "Develop mobile application",
          },
          {
            id: "p3",
            name: "CRM Integration",
            description: "Integrate with CRM system",
          },
        ];

        const tasksData = [
          {
            id: "t1",
            title: "Design Homepage",
            description: "Create wireframes for homepage",
            status: "todo" as "todo",
            priority: "high" as "high",
            dueDate: new Date(2023, 11, 15),
            assignee: "John Doe",
            projectId: "p1",
          },
          {
            id: "t2",
            title: "Implement Authentication",
            description: "Set up user authentication system",
            status: "in-progress" as "in-progress",
            priority: "high" as "high",
            dueDate: new Date(2023, 11, 20),
            assignee: "Jane Smith",
            projectId: "p1",
          },
          {
            id: "t3",
            title: "Database Schema",
            description: "Design database schema",
            status: "review" as "review",
            priority: "medium" as "medium",
            dueDate: new Date(2023, 11, 18),
            assignee: "Mike Johnson",
            projectId: "p2",
          },
          {
            id: "t4",
            title: "API Integration",
            description: "Integrate with third-party APIs",
            status: "done" as "done",
            priority: "medium" as "medium",
            dueDate: new Date(2023, 11, 10),
            assignee: "Sarah Williams",
            projectId: "p2",
          },
          {
            id: "t5",
            title: "User Testing",
            description: "Conduct user testing sessions",
            status: "todo" as "todo",
            priority: "low" as "low",
            dueDate: new Date(2023, 11, 25),
            assignee: "John Doe",
            projectId: "p3",
          },
        ] as Task[];

        setProjects(projectsData);
        setTasks(tasksData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // CRUD operations that would connect to API in production
  const addTask = (task: Omit<Task, "id">) => {
    const newTask: Task = {
      ...task,
      id: `t${tasks.length + 1}`,
    };
    setTasks([...tasks, newTask]);
    // In production: API call to create task
  };

  const updateTask = (updatedTask: Task) => {
    setTasks(
      tasks.map((task) => (task.id === updatedTask.id ? updatedTask : task))
    );
    // In production: API call to update task
  };

  const deleteTask = (taskId: string) => {
    setTasks(tasks.filter((task) => task.id !== taskId));
    // In production: API call to delete task
  };

  const addProject = (project: Omit<Project, "id">) => {
    const newProject: Project = {
      ...project,
      id: `p${projects.length + 1}`,
    };
    setProjects([...projects, newProject]);
    // In production: API call to create project
  };

  return {
    tasks,
    projects,
    loading,
    addTask,
    updateTask,
    deleteTask,
    addProject,
  };
};

// Status columns for Kanban view
const statusColumns = [
  { id: "todo", name: "To Do" },
  { id: "in-progress", name: "In Progress" },
  { id: "review", name: "Review" },
  { id: "done", name: "Done" },
];

// Priority badges
const PriorityBadge = ({ priority }: { priority: string }) => {
  const colorMap = {
    low: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-red-100 text-red-800",
  };

  return (
    <span
      className={`px-2 py-1 text-xs font-medium rounded-full ${
        colorMap[priority as keyof typeof colorMap]
      }`}
    >
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
};

// Task Card Component
const TaskCard = ({
  task,
  onEdit,
  onDelete,
}: {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}) => {
  return (
    <Card className="mb-2">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium">{task.title}</h3>
            <p className="text-sm text-gray-500 mt-1">{task.description}</p>
          </div>
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(task)}
              className="h-8 w-8"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(task.id)}
              className="h-8 w-8 text-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 items-center">
          <PriorityBadge priority={task.priority} />
          <span className="text-xs text-gray-500">
            Due: {format(new Date(task.dueDate), "MMM d, yyyy")}
          </span>
          <span className="text-xs text-gray-500">
            Assignee: {task.assignee}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

// Main Page Component
export default function MultiTaskPage() {
  const {
    tasks,
    projects,
    loading,
    addTask,
    updateTask,
    deleteTask,
    addProject,
  } = useTasksData();

  const [activeView, setActiveView] = useState("kanban");
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [projectFormOpen, setProjectFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  // Task form state
  const [taskForm, setTaskForm] = useState<Omit<Task, "id">>({
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    dueDate: new Date(),
    assignee: "",
    projectId: "",
  });

  // Project form state
  const [projectForm, setProjectForm] = useState({
    name: "",
    description: "",
  });

  // Reset task form
  const resetTaskForm = () => {
    setTaskForm({
      title: "",
      description: "",
      status: "todo" as const,
      priority: "medium" as const,
      dueDate: new Date(),
      assignee: "",
      projectId: "",
    });
    setEditingTask(null);
  };

  // Reset project form
  const resetProjectForm = () => {
    setProjectForm({
      name: "",
      description: "",
    });
  };

  // Handle task edit
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: new Date(task.dueDate),
      assignee: task.assignee,
      projectId: task.projectId,
    });
    setTaskFormOpen(true);
  };

  // Handle task form submit
  const handleTaskSubmit = () => {
    if (
      !taskForm.title ||
      !taskForm.projectId ||
      !taskForm.assignee ||
      !taskForm.dueDate
    ) {
      alert("Please fill in all required fields");
      return;
    }

    if (editingTask) {
      updateTask({
        ...editingTask,
        ...taskForm,
      });
    } else {
      addTask(taskForm);
    }

    resetTaskForm();
    setTaskFormOpen(false);
  };

  // Handle project form submit
  const handleProjectSubmit = () => {
    if (!projectForm.name) {
      alert("Please enter a project name");
      return;
    }

    addProject(projectForm);
    resetProjectForm();
    setProjectFormOpen(false);
  };

  // Handle task drag start
  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  // Handle task drop
  const handleDrop = (status: string) => {
    if (draggedTask && draggedTask.status !== status) {
      const updatedTask = {
        ...draggedTask,
        status: status as Task["status"],
      };
      updateTask(updatedTask);
    }
    setDraggedTask(null);
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading...</h2>
          <p>Fetching your tasks and projects</p>
        </div>
      </div>
    );
  }

  // Kanban View
  const KanbanView = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {statusColumns.map((column) => (
        <div
          key={column.id}
          className="bg-gray-50 rounded-lg p-4"
          onDrop={() => handleDrop(column.id)}
          onDragOver={handleDragOver}
        >
          <h3 className="font-medium mb-3">{column.name}</h3>
          <div className="space-y-2">
            {tasks
              .filter((task) => task.status === column.id)
              .map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={() => handleDragStart(task)}
                  className="cursor-move"
                >
                  <TaskCard
                    task={task}
                    onEdit={handleEditTask}
                    onDelete={deleteTask}
                  />
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );

  // List View
  const ListView = () => (
    <div className="space-y-4">
      {projects.map((project) => (
        <Card key={project.id} className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle>{project.name}</CardTitle>
            <p className="text-sm text-gray-500">{project.description}</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {tasks
                .filter((task) => task.projectId === project.id)
                .map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={handleEditTask}
                    onDelete={deleteTask}
                  />
                ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Calendar View
  const CalendarView = () => {
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(
      new Date()
    );

    // Group tasks by date
    const tasksByDate = tasks.reduce((acc, task) => {
      const dateStr = format(new Date(task.dueDate), "yyyy-MM-dd");
      if (!acc[dateStr]) {
        acc[dateStr] = [];
      }
      acc[dateStr].push(task);
      return acc;
    }, {} as Record<string, Task[]>);

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1">
          <CardContent className="p-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
            />
          </CardContent>
        </Card>
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedDate
                ? format(selectedDate, "MMMM d, yyyy")
                : "Select a date"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDate && (
              <div className="space-y-2">
                {tasksByDate[format(selectedDate, "yyyy-MM-dd")]?.map(
                  (task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onEdit={handleEditTask}
                      onDelete={deleteTask}
                    />
                  )
                ) || <p>No tasks due on this date</p>}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  // Timeline View
  const TimelineView = () => {
    // Sort tasks by due date
    const sortedTasks = [...tasks].sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );

    return (
      <div className="relative">
        <div className="absolute left-9 top-0 bottom-0 w-px bg-gray-200"></div>
        <div className="space-y-8">
          {sortedTasks.map((task) => (
            <div
              key={task.id}
              className="relative flex items-start"
              draggable
              onDragStart={() => handleDragStart(task)}
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white z-10 mr-4">
                <span className="text-xs">
                  {task.priority.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-500 mb-1">
                  {format(new Date(task.dueDate), "MMM d, yyyy")}
                </div>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{task.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {task.description}
                        </p>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditTask(task)}
                          className="h-8 w-8"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteTask(task.id)}
                          className="h-8 w-8 text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 items-center">
                      <Badge
                        variant={
                          task.status === "done" ? "secondary" : "outline"
                        }
                      >
                        {task.status}
                      </Badge>
                      <PriorityBadge priority={task.priority} />
                      <span className="text-xs text-gray-500">
                        Assignee: {task.assignee}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-3xl font-bold mb-4 md:mb-0">Task Management</h1>
        <div className="flex space-x-2">
          <Dialog open={projectFormOpen} onOpenChange={setProjectFormOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="project-name">Project Name</Label>
                  <Input
                    id="project-name"
                    value={projectForm.name}
                    onChange={(e) =>
                      setProjectForm({ ...projectForm, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project-description">Description</Label>
                  <Textarea
                    id="project-description"
                    value={projectForm.description}
                    onChange={(e) =>
                      setProjectForm({
                        ...projectForm,
                        description: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleProjectSubmit}>Create Project</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={taskFormOpen} onOpenChange={setTaskFormOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Task
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {editingTask ? "Edit Task" : "Create New Task"}
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="task-title">Task Title</Label>
                  <Input
                    id="task-title"
                    value={taskForm.title}
                    onChange={(e) =>
                      setTaskForm({ ...taskForm, title: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task-description">Description</Label>
                  <Textarea
                    id="task-description"
                    value={taskForm.description}
                    onChange={(e) =>
                      setTaskForm({
                        ...taskForm,
                        description: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="task-project">Project</Label>
                    <Select
                      value={taskForm.projectId}
                      onValueChange={(value) =>
                        setTaskForm({ ...taskForm, projectId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select project" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="task-status">Status</Label>
                    <Select
                      value={taskForm.status}
                      onValueChange={(value) =>
                        setTaskForm({
                          ...taskForm,
                          status: value as Task["status"],
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusColumns.map((status) => (
                          <SelectItem key={status.id} value={status.id}>
                            {status.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="task-priority">Priority</Label>
                    <Select
                      value={taskForm.priority}
                      onValueChange={(value) =>
                        setTaskForm({
                          ...taskForm,
                          priority: value as Task["priority"],
                        })
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
                  <div className="space-y-2">
                    <Label>Due Date</Label>
                    <div className="flex">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {taskForm.dueDate
                              ? format(taskForm.dueDate, "PPP")
                              : "Pick a date"}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="p-0">
                          <Calendar
                            mode="single"
                            selected={taskForm.dueDate}
                            onSelect={(date) =>
                              setTaskForm({
                                ...taskForm,
                                dueDate: date || new Date(),
                              })
                            }
                            initialFocus
                          />
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task-assignee">Assignee</Label>
                  <Input
                    id="task-assignee"
                    value={taskForm.assignee}
                    onChange={(e) =>
                      setTaskForm({ ...taskForm, assignee: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleTaskSubmit}>
                  {editingTask ? "Update Task" : "Create Task"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs
        defaultValue="kanban"
        value={activeView}
        onValueChange={setActiveView}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="kanban">
            <LayoutGrid className="h-4 w-4 mr-2" />
            Kanban
          </TabsTrigger>
          <TabsTrigger value="list">
            <List className="h-4 w-4 mr-2" />
            List
          </TabsTrigger>
          <TabsTrigger value="calendar">
            <CalendarIcon className="h-4 w-4 mr-2" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="timeline">
            <TimerIcon className="h-4 w-4 mr-2" />
            Timeline
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="kanban">
            <ScrollArea className="h-[calc(100vh-220px)]">
              <KanbanView />
            </ScrollArea>
          </TabsContent>
          <TabsContent value="list">
            <ScrollArea className="h-[calc(100vh-220px)]">
              <ListView />
            </ScrollArea>
          </TabsContent>
          <TabsContent value="calendar">
            <ScrollArea className="h-[calc(100vh-220px)]">
              <CalendarView />
            </ScrollArea>
          </TabsContent>
          <TabsContent value="timeline">
            <ScrollArea className="h-[calc(100vh-220px)]">
              <TimelineView />
            </ScrollArea>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
