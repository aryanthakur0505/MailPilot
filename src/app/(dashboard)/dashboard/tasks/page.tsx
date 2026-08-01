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
import { TaskCheckbox } from "@/components/dashboard/TaskCheckbox";
import { TaskActions } from "@/components/dashboard/TaskActions";
import { AddTaskForm } from "@/components/dashboard/AddTaskForm";

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
      return { label: "Overdue", color: "#f87171", bg: "rgba(239,68,68,0.08)" };
    }
    if (isToday(dueDate)) {
      return { label: "Today", color: "#fbbf24", bg: "rgba(251,191,36,0.08)" };
    }
    return {
      label: format(dueDate, "MMM d"),
      color: "var(--text-muted)",
      bg: "var(--bg-elevated)",
    };
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Tasks
          </h1>
          <p className="mt-1.5 text-sm" style={{ color: "var(--text-muted)" }}>
            Action items extracted from your emails by AI
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {overdueTasks.length > 0 && (
            <span
              className="text-xs font-medium rounded-full px-3 py-1.5"
              style={{
                backgroundColor: "rgba(239,68,68,0.08)",
                color: "#f87171",
                border: "1px solid rgba(239,68,68,0.15)",
              }}
            >
              {overdueTasks.length} overdue
            </span>
          )}
          <span
            className="flex items-center gap-1.5 text-xs font-medium rounded-full px-3 py-1.5"
            style={{
              backgroundColor: "rgba(52,211,153,0.08)",
              color: "#34d399",
              border: "1px solid rgba(52,211,153,0.15)",
            }}
          >
            <CheckCircle2 size={11} />
            {completedTasks.length}/{tasks.length} done
          </span>
        </div>
      </div>

      {/* Add Task Form */}
      <AddTaskForm />

      {/* Empty state */}
      {tasks.length === 0 && (
        <div
          className="rounded-2xl p-12 text-center"
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{
              background:
                "linear-gradient(135deg, rgba(52,211,153,0.15), rgba(16,185,129,0.1))",
              border: "1px solid rgba(52,211,153,0.2)",
            }}
          >
            <ListTodo size={24} style={{ color: "#34d399" }} strokeWidth={1.5} />
          </div>
          <h2
            className="text-lg font-semibold mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            No tasks yet
          </h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Add a task above, or sync your emails and the AI will extract action items automatically.
          </p>
        </div>
      )}

      {/* Pending Tasks */}
      {pendingTasks.length > 0 && (
        <div className="space-y-4">
          <h2
            className="text-xs font-semibold uppercase tracking-[0.1em]"
            style={{ color: "var(--text-muted)" }}
          >
            Pending · {pendingTasks.length}
          </h2>
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            {pendingTasks.map((task, i) => {
              const badge = getDueBadge(task.dueDate);
              return (
                <div
                  key={task.id}
                  className="group flex items-start gap-4 px-5 py-4 transition-colors duration-150"
                  style={{
                    borderBottom:
                      i < pendingTasks.length - 1
                        ? "1px solid var(--border-subtle)"
                        : "none",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "var(--bg-elevated)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                >
                  <TaskCheckbox taskId={task.id} completed={task.completed} />

                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {task.title}
                    </p>
                    {task.email && (
                      <div
                        className="flex items-center gap-1.5 mt-1 text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        <Mail size={10} />
                        <span className="truncate">
                          {task.email.fromName || task.email.from}
                          {task.email.subject ? ` · ${task.email.subject}` : ""}
                        </span>
                      </div>
                    )}
                    {!task.email && (
                      <p className="mt-1 text-xs" style={{ color: "var(--text-faint)" }}>
                        Added manually
                      </p>
                    )}
                  </div>

                  {/* Due badge (shown when no actions visible) */}
                  {badge && (
                    <span
                      className="shrink-0 group-hover:hidden flex items-center gap-1 text-xs font-medium rounded-full px-2.5 py-1"
                      style={{
                        backgroundColor: badge.bg,
                        color: badge.color,
                        border: `1px solid ${badge.color}30`,
                      }}
                    >
                      <Calendar size={10} />
                      {badge.label}
                    </span>
                  )}

                  {/* Actions — visible on hover */}
                  <TaskActions
                    taskId={task.id}
                    dueDate={task.dueDate ? task.dueDate.toISOString() : null}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div className="space-y-3">
          <h2
            className="text-xs font-semibold uppercase tracking-[0.1em]"
            style={{ color: "var(--text-muted)" }}
          >
            Completed · {completedTasks.length}
          </h2>
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
              opacity: 0.55,
            }}
          >
            {completedTasks.map((task, i) => (
              <div
                key={task.id}
                className="group flex items-center gap-4 px-5 py-3.5"
                style={{
                  borderBottom:
                    i < completedTasks.length - 1
                      ? "1px solid var(--border-subtle)"
                      : "none",
                }}
              >
                <TaskCheckbox taskId={task.id} completed={task.completed} />
                <p
                  className="flex-1 text-sm line-through"
                  style={{ color: "var(--text-muted)" }}
                >
                  {task.title}
                </p>
                {/* Allow deleting completed tasks too */}
                <TaskActions taskId={task.id} dueDate={null} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
