// ==================================================
// MailPilot — Tasks Page (Phase 5)
// ==================================================
// Lists all AI-extracted + manually-added tasks.
// Features: completion toggle, due date editing,
// delete, and manual task creation.

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format, isPast, isToday } from "date-fns";
import { ListTodo, Mail, Calendar, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TaskCheckbox } from "@/components/dashboard/TaskCheckbox";
import { TaskActions } from "@/components/dashboard/TaskActions";
import { AddTaskForm } from "@/components/dashboard/AddTaskForm";
import { cn } from "@/lib/utils";

export default async function TasksPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const tasks = await prisma.task.findMany({
    where: { userId: session.user.id },
    orderBy: [{ completed: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
    include: {
      email: {
        select: {
          subject: true,
          fromName: true,
          from: true,
        },
      },
    },
  });

  const pendingTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);
  const overdueTasks = pendingTasks.filter(
    (t) => t.dueDate && isPast(t.dueDate) && !isToday(t.dueDate)
  );

  function getDueBadge(dueDate: Date | null) {
    if (!dueDate) return null;
    if (isPast(dueDate) && !isToday(dueDate)) {
      return { label: "Overdue", className: "bg-red-500/10 text-red-600 dark:text-red-400" };
    }
    if (isToday(dueDate)) {
      return { label: "Today", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400" };
    }
    return { label: format(dueDate, "MMM d"), className: "bg-muted text-muted-foreground" };
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Action items extracted from your emails by AI
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {overdueTasks.length > 0 && (
            <Badge variant="destructive">{overdueTasks.length} overdue</Badge>
          )}
          <Badge variant="secondary" className="gap-1.5 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 size={11} />
            {completedTasks.length}/{tasks.length} done
          </Badge>
        </div>
      </div>

      <AddTaskForm />

      {tasks.length === 0 && (
        <Card className="p-12 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-xl bg-emerald-500/10">
            <ListTodo size={24} className="text-emerald-600 dark:text-emerald-400" strokeWidth={1.5} />
          </div>
          <h2 className="mb-2 text-lg font-semibold">No tasks yet</h2>
          <p className="text-sm text-muted-foreground">
            Add a task above, or sync your emails and the AI will extract action items automatically.
          </p>
        </Card>
      )}

      {pendingTasks.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Pending · {pendingTasks.length}
          </h2>
          <Card className="p-0">
            {pendingTasks.map((task, i) => {
              const badge = getDueBadge(task.dueDate);
              return (
                <div
                  key={task.id}
                  className={cn(
                    "group flex items-start gap-4 px-5 py-4 transition-colors hover:bg-muted/40",
                    i < pendingTasks.length - 1 && "border-b"
                  )}
                >
                  <TaskCheckbox taskId={task.id} completed={task.completed} />

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{task.title}</p>
                    {task.email ? (
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Mail size={10} />
                        <span className="truncate">
                          {task.email.fromName || task.email.from}
                          {task.email.subject ? ` · ${task.email.subject}` : ""}
                        </span>
                      </div>
                    ) : (
                      <p className="mt-1 text-xs text-muted-foreground/70">Added manually</p>
                    )}
                  </div>

                  {badge && (
                    <span
                      className={cn(
                        "flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium group-hover:hidden",
                        badge.className
                      )}
                    >
                      <Calendar size={10} />
                      {badge.label}
                    </span>
                  )}

                  <TaskActions taskId={task.id} dueDate={task.dueDate ? task.dueDate.toISOString() : null} />
                </div>
              );
            })}
          </Card>
        </div>
      )}

      {completedTasks.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Completed · {completedTasks.length}
          </h2>
          <Card className="p-0 opacity-55">
            {completedTasks.map((task, i) => (
              <div
                key={task.id}
                className={cn(
                  "group flex items-center gap-4 px-5 py-3.5",
                  i < completedTasks.length - 1 && "border-b"
                )}
              >
                <TaskCheckbox taskId={task.id} completed={task.completed} />
                <p className="flex-1 text-sm text-muted-foreground line-through">{task.title}</p>
                <TaskActions taskId={task.id} dueDate={null} />
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
}
