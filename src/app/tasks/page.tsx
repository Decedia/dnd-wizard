"use client";

import { useState } from "react";
import {
  House,
  Folder,
  ListChecks,
  Kanban,
  ChartBar,
  Gear,
  Bell,
  MagnifyingGlass,
  Plus,
  Clock,
  Timer,
  DotsThree,
  CaretDown,
  CheckCircle,
  Circle,
  WarningCircle,
  Package,
  Target,
  ShoppingCart,
  Rocket,
  PuzzlePiece,
} from "phosphor-react";

interface Task {
  id: string;
  title: string;
  status: "todo" | "in-progress" | "done" | "review";
  icon: string;
  timeSpent?: string;
  budget?: string;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; weight?: "regular" | "fill" | "bold" | "duotone" }>> = {
  "Clock": Clock,
  "Package": Package,
  "Target": Target,
  "ShoppingCart": ShoppingCart,
  "Rocket": Rocket,
  "PuzzlePiece": PuzzlePiece,
};

const initialTasks: Task[] = [
  {
    id: "1",
    title: "Time tracking",
    status: "in-progress",
    icon: "Clock",
    timeSpent: "03:41:39"
  },
  {
    id: "2",
    title: "Time tracking",
    status: "in-progress",
    icon: "Clock",
    timeSpent: "00:06:16"
  },
  {
    id: "3",
    title: "Export finalized assets and documentation for the development team.",
    status: "review",
    icon: "Package",
  },
  {
    id: "4",
    title: "Prepare an interactive prototype for stakeholder review and usability testing.",
    status: "in-progress",
    icon: "Target",
  },
  {
    id: "5",
    title: "Redesign the checkout/contact flow to minimize friction and reduce the bounce rate.",
    status: "done",
    icon: "ShoppingCart",
    budget: "$1,000"
  },
  {
    id: "6",
    title: "Optimize the hero section with a clear value proposition and a high-impact call-to-action (CTA).",
    status: "in-progress",
    icon: "Rocket",
  },
  {
    id: "7",
    title: "Develop a reusable component library (buttons, inputs, cards) to maintain design consistency across the site.",
    status: "todo",
    icon: "PuzzlePiece",
  }
];

const sidebarItems = [
  { icon: House, label: "Dashboard", active: false },
  { icon: Folder, label: "Projects", active: false },
  { icon: ListChecks, label: "Tasks", active: true },
  { icon: Kanban, label: "Board", active: false },
  { icon: ChartBar, label: "Analytics", active: false },
  { icon: Gear, label: "Settings", active: false },
];

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [searchQuery, setSearchQuery] = useState("");

  const todoCount = tasks.filter(t => t.status === "todo").length;
  const inProgressCount = tasks.filter(t => t.status === "in-progress").length;
  const doneCount = tasks.filter(t => t.status === "done").length;
  const reviewCount = tasks.filter(t => t.status === "review").length;
  const totalCount = tasks.length;

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id !== id) return task;
      if (task.status === "done") {
        return { ...task, status: "todo" as const };
      }
      return { ...task, status: "done" as const };
    }));
  };

  const getStatusBadge = (status: Task["status"]) => {
    switch (status) {
      case "todo":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-paper-muted px-2.5 py-0.5 text-[10px] font-semibold text-ink-muted uppercase tracking-wider">
             <Circle weight="regular" className="h-2.5 w-2.5" />
            Todo
          </span>
        );
      case "in-progress":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-paper-muted px-2.5 py-0.5 text-[10px] font-semibold text-ink uppercase tracking-wider">
             <Timer weight="regular" className="h-2.5 w-2.5" />
            In Progress
          </span>
        );
      case "done":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-paper-muted px-2.5 py-0.5 text-[10px] font-semibold text-ink uppercase tracking-wider">
             <CheckCircle weight="regular" className="h-2.5 w-2.5" />
            Done
          </span>
        );
      case "review":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-paper-muted px-2.5 py-0.5 text-[10px] font-semibold text-ink uppercase tracking-wider">
             <WarningCircle weight="regular" className="h-2.5 w-2.5" />
            Review
          </span>
        );
    }
  };

  return (
    <div className="flex h-screen bg-paper">
      {/* Sidebar */}
      <aside className="flex w-16 flex-col items-center bg-ink py-4">
        <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-white text-ink">
          <span className="font-display text-lg font-bold">R</span>
        </div>

        <nav className="flex flex-1 flex-col items-center gap-1">
          {sidebarItems.map((item) => (
              <button
              key={item.label}
              className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                item.active
                  ? "border-2 border-white bg-transparent text-white"
                  : "border border-white/20 bg-transparent text-white/70 hover:text-white hover:bg-white/10"
              }`}
              title={item.label}
            >
               <item.icon weight={item.active ? "fill" : "regular"} className="h-5 w-5" />
            </button>
          ))}
        </nav>

        <button className="mt-auto flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white/70 hover:text-white hover:bg-white/10 transition-colors">
           <Bell weight="regular" className="h-5 w-5" />
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-6 py-8">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-page-title">Tasks</h1>
              <p className="mt-1 text-description">
                {doneCount} of {totalCount} done across all projects
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink/90 transition-colors">
                 <Gear weight="regular" className="h-4 w-4" />
                <span>Upgrade</span>
              </button>
              <button className="flex h-9 w-9 items-center justify-center rounded-full border border-border-strong bg-white text-ink hover:bg-paper-muted transition-colors">
                 <MagnifyingGlass weight="regular" className="h-4 w-4" />
              </button>
              <button className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border-strong bg-white text-ink hover:bg-paper-muted transition-colors">
                 <Bell weight="regular" className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-ink text-[10px] font-bold text-white">
                  30
                </span>
              </button>
              <div className="h-9 w-9 rounded-full bg-ink/10" />
              <button className="flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink/90 transition-colors">
                 <Plus weight="regular" className="h-4 w-4" />
                <span>Add Task</span>
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="mb-8 grid grid-cols-4 gap-4">
            <div className="rounded-2xl bg-paper-muted p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted uppercase tracking-wider">To Do</p>
                  <p className="mt-2 text-3xl font-semibold text-ink">0</p>
                  <p className="mt-1 text-muted">Not started</p>
                </div>
                <button className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted hover:bg-paper transition-colors">
                   <Clock weight="regular" className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="rounded-2xl bg-paper-muted p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted uppercase tracking-wider">In Progress</p>
                  <p className="mt-2 text-3xl font-semibold text-ink">4</p>
                  <p className="mt-1 text-muted">Active tasks</p>
                </div>
                <button className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted hover:bg-paper transition-colors">
                   <Clock weight="regular" className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="rounded-2xl bg-paper-muted p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted uppercase tracking-wider">Done</p>
                  <p className="mt-2 text-3xl font-semibold text-ink">6</p>
                  <p className="mt-1 text-muted">Completed</p>
                </div>
                <button className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted hover:bg-paper transition-colors">
                   <CheckCircle weight="regular" className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="rounded-2xl bg-paper-muted p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted uppercase tracking-wider">Total Tasks</p>
                  <p className="mt-2 text-3xl font-semibold text-ink">12</p>
                  <p className="mt-1 text-muted">All tasks</p>
                </div>
                <button className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted hover:bg-paper transition-colors">
                   <ListChecks weight="regular" className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Task List */}
          <div className="rounded-2xl bg-paper-muted">
            {/* Filters */}
            <div className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-4">
                <h2 className="text-card-title">All tasks</h2>
                <span className="text-muted">{totalCount} tasks</span>
              </div>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-ink border border-border-strong hover:bg-paper-muted transition-colors">
                  <span>All Projects</span>
                   <CaretDown weight="regular" className="h-3.5 w-3.5" />
                </button>
                <button className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-ink border border-border-strong hover:bg-paper-muted transition-colors">
                  <span>Date Created</span>
                   <CaretDown weight="regular" className="h-3.5 w-3.5" />
                </button>
                <button className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-ink border border-border-strong hover:bg-paper-muted transition-colors">
                  <span>All</span>
                   <CaretDown weight="regular" className="h-3.5 w-3.5" />
                </button>
                <div className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 border border-border-strong">
                  <div className="h-1.5 w-16 rounded-full bg-paper-muted">
                    <div className="h-full w-[60%] rounded-full bg-ink" />
                  </div>
                  <span className="text-xs font-medium text-ink-muted">60%</span>
                </div>
                <button className="flex h-8 w-8 items-center justify-center rounded-full border border-border-strong text-ink-muted hover:bg-paper-muted transition-colors">
                   <ListChecks weight="regular" className="h-4 w-4" />
                </button>
                <button className="flex h-8 w-8 items-center justify-center rounded-full border border-border-strong text-ink-muted hover:bg-paper-muted transition-colors">
                   <Kanban weight="regular" className="h-4 w-4" />
                </button>
                <div className="relative">
                   <MagnifyingGlass weight="regular" className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted" />
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 w-48 rounded-full bg-white pl-8 pr-3 text-xs text-ink placeholder:text-ink-subtle border border-border-strong focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Task Items */}
            <div className="divide-y divide-paper-dark">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/50 transition-colors"
                >
                  <button
                    onClick={() => toggleTask(task.id)}
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border-strong bg-white hover:border-ink transition-colors"
                  >
                    {task.status === "done" && (
                      <CheckCircle weight="regular" className="h-3.5 w-3.5 text-ink" />
                    )}
                  </button>

                  <span className="text-lg">
                    {(() => {
                      const Icon = ICON_MAP[task.icon];
                      if (Icon) {
                        return <Icon weight="regular" className="h-5 w-5" />;
                      }
                      return task.icon;
                    })()}
                  </span>

                  <p className={`flex-1 text-body ${task.status === "done" ? "text-ink-muted line-through" : ""}`}>
                    {task.title}
                  </p>

                  <div className="flex items-center gap-3">
                    {getStatusBadge(task.status)}
                    {task.timeSpent && (
                      <span className="flex items-center gap-1 text-xs text-ink-muted">
                         <Clock weight="regular" className="h-3 w-3" />
                        {task.timeSpent}
                      </span>
                    )}
                    {task.budget && (
                      <span className="rounded-full bg-white border border-border-strong px-2.5 py-0.5 text-xs font-medium text-ink">
                        {task.budget}
                      </span>
                    )}
                    <button className="flex h-7 w-7 items-center justify-center rounded-full border border-border-strong text-ink-muted hover:bg-paper transition-colors">
                       <DotsThree weight="regular" className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
