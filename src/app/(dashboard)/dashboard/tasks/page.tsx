// ==================================================
// MailPilot — Tasks Page
// ==================================================
// Lists all AI-extracted tasks with completion toggle.

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDistanceToNow, format, isPast, isToday } from "date-fns";
import { ListTodo, Mail, Calendar, CheckCircle2, Circle } from "lucide-react";
import { TaskCheckbox } from "@/components/dashboard/TaskCheckbox";

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
      <div className="flex items-start justify-between">
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
        <div className="flex items-center gap-2">
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
              background: "linear-gradient(135deg, rgba(52,211,153,0.15), rgba(16,185,129,0.1))",
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
            Sync your emails and the AI worker will automatically extract action items.
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
                  className="flex items-start gap-4 px-5 py-4"
                  style={{
                    borderBottom:
                      i < pendingTasks.length - 1
                        ? "1px solid var(--border-subtle)"
                        : "none",
                  }}
                >
                  <TaskCheckbox taskId={task.id} completed={task.completed} />

                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {task.title}
                    </p>
                    <div
                      className="flex items-center gap-2 mt-1 text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      <Mail size={10} />
                      <span className="truncate">
                        {task.email.fromName || task.email.from} · {task.email.subject}
                      </span>
                    </div>
                  </div>

                  {badge && (
                    <span
                      className="shrink-0 flex items-center gap-1 text-xs font-medium rounded-full px-2.5 py-1"
                      style={{
                        backgroundColor: badge.bg,
                        color: badge.color,
                        border: `1px solid ${badge.color}20`,
                      }}
                    >
                      <Calendar size={10} />
                      {badge.label}
                    </span>
                  )}
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
              opacity: 0.6,
            }}
          >
            {completedTasks.map((task, i) => (
              <div
                key={task.id}
                className="flex items-center gap-4 px-5 py-3.5"
                style={{
                  borderBottom:
                    i < completedTasks.length - 1
                      ? "1px solid var(--border-subtle)"
                      : "none",
                }}
              >
                <TaskCheckbox taskId={task.id} completed={task.completed} />
                <p
                  className="text-sm line-through"
                  style={{ color: "var(--text-muted)" }}
                >
                  {task.title}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
