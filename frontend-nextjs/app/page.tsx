"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { KanbanSquareIcon, ListTreeIcon, Table2Icon } from "lucide-react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000";
const TOKEN_KEY = "devtrack_token";

type TaskStatus = "todo" | "in_progress" | "in_review" | "done";

type Priority = "Low" | "Medium" | "High";

type Task = {
  _id: string;
  title: string;
  description?: string;
  priority: Priority;
  status: TaskStatus;
  completed: boolean;
  imageUrl?: string | null;
  createdAt: string;
};

type UserProfile = {
  id: string;
  name: string;
  email: string;
  bio?: string;
  avatarUrl?: string | null;
  createdAt?: string;
};

const STATUS_COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: "todo",         label: "To Do" },
  { id: "in_progress",  label: "In Progress" },
  { id: "in_review",    label: "In Review" },
  { id: "done",         label: "Done" },
];

const PRIORITY_COLORS: Record<Priority, string> = {
  Low: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Medium: "bg-amber-100 text-amber-700 border-amber-200",
  High: "bg-rose-100 text-rose-700 border-rose-200",
};

const getStoredToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
};

const setStoredToken = (token: string) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
};

const clearStoredToken = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
};

async function apiRequest<T>(
  path: string,
  token: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    const message =
      data?.message || data?.error || `Request failed with ${res.status}`;
    throw new Error(message);
  }

  return data as T;
}

export default function Home() {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginSubmitting, setLoginSubmitting] = useState(false);

  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPriority, setNewPriority] = useState<Priority>("Medium");
  const [newStatus, setNewStatus] = useState<TaskStatus>("todo");
  const [newImage, setNewImage] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);

  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null);
  const [previewTask, setPreviewTask] = useState<Task | null>(null);

  // Check for existing token and validate with /api/profile
  useEffect(() => {
    let cancelled = false;

    const checkAuth = async () => {
      try {
        setAuthLoading(true);
        setAuthError(null);
        const stored = getStoredToken();
        if (!stored) {
          return;
        }

        const res = await fetch(`${API_BASE_URL}/api/profile`, {
          headers: {
            Authorization: `Bearer ${stored}`,
          },
        });

        const data = (await res.json()) as UserProfile | { message?: string };

        if (!res.ok) {
          throw new Error(
            (data as any)?.message || "Failed to validate session"
          );
        }

        if (!cancelled) {
          setAuthToken(stored);
          setUser(data as UserProfile);
        }
      } catch (err: any) {
        if (!cancelled) {
          clearStoredToken();
          setAuthToken(null);
          setUser(null);
          setAuthError(err.message ?? "Session expired. Please log in again.");
        }
      } finally {
        if (!cancelled) {
          setAuthLoading(false);
        }
      }
    };

    checkAuth();

    return () => {
      cancelled = true;
    };
  }, [authToken]);

  // Load tasks once authenticated
  useEffect(() => {
    if (!authToken) return;

    let cancelled = false;

    const load = async () => {
      try {
        setError(null);
        setLoading(true);
        const data = await apiRequest<Task[]>("/api/tasks", authToken);
        if (!cancelled) {
          setTasks(data);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message ?? "Failed to load tasks");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [authToken]);

  const grouped = useMemo(() => {
    const byStatus: Record<TaskStatus, Task[]> = {
      todo: [],
      in_progress: [],
      in_review: [],
      done: [],
    };
    for (const task of tasks) {
      byStatus[task.status ?? "todo"].push(task);
    }
    return byStatus;
  }, [tasks]);

  const handleCreateTask = async () => {
    if (!newTitle.trim()) return;
    if (!authToken) return;
    try {
      setCreating(true);
      const formData = new FormData();
      formData.append("title", newTitle.trim());
      if (newDescription.trim()) {
        formData.append("description", newDescription.trim());
      }
      formData.append("priority", newPriority);
      formData.append("status", newStatus);
      if (newImage) {
        formData.append("image", newImage);
      }

      const created = await apiRequest<Task>("/api/tasks", authToken, {
        method: "POST",
        body: formData,
      });
      setTasks((prev) => [created, ...prev]);
      setNewTitle("");
      setNewDescription("");
      setNewPriority("Medium");
      setNewStatus("todo");
      setNewImage(null);
      return true;
    } catch (err: any) {
      setError(err.message ?? "Failed to create task");
      return false;
    } finally {
      setCreating(false);
    }
  };

  const moveTask = async (task: Task, status: TaskStatus) => {
    if (task.status === status) return;
    if (!authToken) return;
    try {
      const updated = await apiRequest<Task>(
        `/api/tasks/${task._id}`,
        authToken,
        {
          method: "PUT",
          body: JSON.stringify({ status }),
        }
      );
      setTasks((prev) =>
        prev.map((t) => (t._id === updated._id ? updated : t))
      );
    } catch (err: any) {
      setError(err.message ?? "Failed to update task");
    }
  };

  const formatDate = (iso: string | undefined) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const initialsFromTitle = (title: string) => {
    if (!title) return "T";
    const words = title.split(" ").filter(Boolean);
    if (words.length === 1) return words[0][0]?.toUpperCase() ?? "T";
    return (words[0][0] + words[1][0]).toUpperCase();
  };

  const handleDragStart = (
    event: React.DragEvent<HTMLDivElement>,
    task: Task
  ) => {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData(
      "application/json",
      JSON.stringify({ taskId: task._id })
    );
    setDraggingTaskId(task._id);
  };

  const handleDragEnd = () => {
    setDraggingTaskId(null);
    setDragOverStatus(null);
  };

  const handleDragOverColumn = (
    event: React.DragEvent<HTMLDivElement>,
    status: TaskStatus
  ) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragOverStatus(status);
  };

  const handleDropOnColumn = async (
    event: React.DragEvent<HTMLDivElement>,
    status: TaskStatus
  ) => {
    event.preventDefault();
    setDragOverStatus(null);

    const raw = event.dataTransfer.getData("application/json");
    if (!raw) return;

    try {
      const { taskId } = JSON.parse(raw) as { taskId: string };
      const task = tasks.find((t) => t._id === taskId);
      if (!task || task.status === status) return;
      await moveTask(task, status);
    } catch {
      // ignore malformed payloads
    } finally {
      setDraggingTaskId(null);
    }
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setLoginSubmitting(true);
      setAuthError(null);
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: loginEmail.trim(),
          password: loginPassword,
        }),
      });

      const data = (await res.json()) as {
        token?: string;
        user?: UserProfile;
        message?: string;
      };

      if (!res.ok || !data.token || !data.user) {
        throw new Error(
          data.message || "Unable to log in. Check your credentials."
        );
      }

      setStoredToken(data.token);
      setAuthToken(data.token);
      setUser(data.user);
      setLoginPassword("");
    } catch (err: any) {
      setAuthToken(null);
      setUser(null);
      setAuthError(err.message ?? "Failed to log in");
    } finally {
      setLoginSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Checking session…</p>
      </div>
    );
  }

  if (!authToken || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-xl bg-linear-to-tr from-sky-500 to-emerald-400 flex items-center justify-center text-xs font-bold text-white">
                DT
              </div>
              <div className="flex flex-col">
                <CardTitle className="text-base">DevTrack</CardTitle>
                <CardDescription className="text-xs">
                  Sign in to manage your DevOps tasks.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
              {authError && (
                <p className="text-xs text-destructive">{authError}</p>
              )}
              <p className="text-[11px] text-muted-foreground">
                Users are created via the backend `/api/auth/register` endpoint.
              </p>
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                className="w-full"
                disabled={loginSubmitting || !loginEmail || !loginPassword}
              >
                {loginSubmitting ? "Signing in…" : "Sign in"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" variant="inset">
        <SidebarHeader>
          <div className="flex items-center gap-2 px-1">
            <div className="size-8 rounded-xl bg-linear-to-tr from-sky-500 to-emerald-400 flex items-center justify-center text-xs font-bold text-white">
              DT
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight">
                DevTrack
              </span>
              <span className="text-[11px] text-muted-foreground">
                DevOps Tasks
              </span>
            </div>
          </div>
        </SidebarHeader>
        <SidebarSeparator />
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Menu</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive>
                    <KanbanSquareIcon className="text-sky-500" />
                    <span>Tasks</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 bg-secondary/60">
            <Avatar className="size-8">
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-xs font-medium leading-tight">
                Your Profile
              </span>
              <span className="text-[11px] text-muted-foreground">
                Connected to backend
              </span>
            </div>
          </div>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <div className="flex h-16 items-center justify-between border-b px-6">
          <div className="flex items-center gap-3">
            <SidebarTrigger />
            <div>
              <h1 className="text-lg font-semibold tracking-tight">Tasks</h1>
              <p className="text-xs text-muted-foreground">
                Kanban view of your DevOps work.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Tabs defaultValue="kanban" className="hidden md:flex">
              <TabsList variant="line">
                <TabsTrigger value="table" disabled>
                  <Table2Icon className="size-3.5" />
                  Table
                </TabsTrigger>
                <TabsTrigger value="list" disabled>
                  <ListTreeIcon className="size-3.5" />
                  List
                </TabsTrigger>
                <TabsTrigger value="kanban">
                  <KanbanSquareIcon className="size-3.5" />
                  Kanban
                </TabsTrigger>
              </TabsList>
              <TabsContent value="kanban" />
            </Tabs>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm">
                  + Create Task
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create task</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 py-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium" htmlFor="title">
                      Title
                    </label>
                    <Input
                      id="title"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="e.g. Configure CI pipeline"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label
                      className="text-xs font-medium"
                      htmlFor="description"
                    >
                      Description
                    </label>
                    <Textarea
                      id="description"
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      rows={3}
                      placeholder="Add context, tools, environments…"
                    />
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1 space-y-1.5">
                      <label className="text-xs font-medium">Priority</label>
                      <Select
                        value={newPriority}
                        onValueChange={(v: Priority) => setNewPriority(v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Low">Low</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <label className="text-xs font-medium">Status</label>
                      <Select
                        value={newStatus}
                        onValueChange={(v: TaskStatus) => setNewStatus(v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_COLUMNS.map((col) => (
                            <SelectItem key={col.id} value={col.id}>
                              {col.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="task-image"
                      className="text-xs font-medium text-muted-foreground"
                    >
                      Attachment (image)
                    </label>
                    <Input
                      id="task-image"
                      type="file"
                      accept="image/*"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        setNewImage(file ?? null);
                      }}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Optional: add an architecture diagram or screenshot for
                      this task.
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    size="sm"
                    onClick={handleCreateTask}
                    disabled={creating || !newTitle.trim()}
                  >
                    {creating ? "Creating…" : "Create task"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <main className="flex-1 overflow-hidden px-4 pb-6 pt-4">
          {error && (
            <div className="mb-3 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              {error}
            </div>
          )}
          {loading ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Loading tasks…
            </div>
          ) : (
            <div className="grid h-full gap-3 md:grid-cols-4">
              {STATUS_COLUMNS.map((column) => {
                const items = grouped[column.id];
                return (
                  <Card
                    key={column.id}
                    className={cn(
                      "flex min-h-[260px] flex-col bg-muted/40 border border-transparent transition-colors",
                      dragOverStatus === column.id &&
                        "border-primary/40 bg-primary/5"
                    )}
                    onDragOver={(event) =>
                      handleDragOverColumn(event, column.id)
                    }
                    onDrop={(event) => handleDropOnColumn(event, column.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-sm font-semibold">
                          {column.label}
                        </CardTitle>
                        <Badge
                          variant="outline"
                          className="text-[11px] px-2 py-0.5"
                        >
                          {items.length.toString().padStart(2, "0")}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 px-2 pb-2">
                      <ScrollArea className="h-full rounded-lg pr-2">
                        <div className="flex flex-col gap-2 pb-2">
                          {items.map((task) => (
                            <div
                              key={task._id}
                              draggable
                              onDragStart={(event) =>
                                handleDragStart(event, task)
                              }
                              onDragEnd={handleDragEnd}
                              className={cn(
                                "w-full text-left cursor-grab active:cursor-grabbing",
                                draggingTaskId === task._id && "opacity-70"
                              )}
                            >
                              <div className="rounded-xl border bg-card px-3 py-3 text-xs shadow-sm hover:border-primary/40 hover:shadow">
                                <div className="mb-1 flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <Avatar className="size-6 border border-border/60">
                                      <AvatarFallback className="text-[9px]">
                                        {initialsFromTitle(task.title)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                      <span className="text-[13px] font-medium leading-tight line-clamp-2">
                                        {task.title}
                                      </span>
                                      {task.description && (
                                        <span className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
                                          {task.description}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                {task.imageUrl && (
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      setPreviewTask(task);
                                    }}
                                    className="mt-1 w-full overflow-hidden rounded-lg border bg-muted/40"
                                  >
                                    <img
                                      src={`${API_BASE_URL}${task.imageUrl}`}
                                      alt={task.title}
                                      className="h-20 w-full object-cover"
                                    />
                                  </button>
                                )}
                                <div className="mt-2 flex items-center justify-between gap-2">
                                  <Badge
                                    variant="outline"
                                    className={PRIORITY_COLORS[task.priority]}
                                  >
                                    {task.priority}
                                  </Badge>
                                  <span className="text-[10px] text-muted-foreground">
                                    {formatDate(task.createdAt)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                          {items.length === 0 && (
                            <p className="py-4 text-center text-[11px] text-muted-foreground">
                              No tasks in this column.
                            </p>
                          )}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </main>
        {previewTask && (
          <Dialog
            open={!!previewTask}
            onOpenChange={(open) => {
              if (!open) setPreviewTask(null);
            }}
          >
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>{previewTask.title}</DialogTitle>
              </DialogHeader>
              <div className="mt-2">
                <img
                  src={`${API_BASE_URL}${previewTask.imageUrl}`}
                  alt={previewTask.title}
                  className="max-h-[70vh] w-full rounded-lg object-contain"
                />
              </div>
            </DialogContent>
          </Dialog>
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}
