"use client";

// ==================================================
// MailPilot — Task Actions (Client Component)
// ==================================================
// Per-task row: delete button + inline due date picker.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Calendar, Loader2 } from "lucide-react";

interface TaskActionsProps {
  taskId: string;
  dueDate: string | null; // ISO string
}

export function TaskActions({ taskId, dueDate: initialDueDate }: TaskActionsProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [savingDate, setSavingDate] = useState(false);
  const [dueDate, setDueDate] = useState(
    initialDueDate ? new Date(initialDueDate).toISOString().split("T")[0] : ""
  );

  async function handleDelete() {
    setDeleting(true);
    try {
      await fetch(`/api/ai/tasks/${taskId}`, { method: "DELETE" });
      router.refresh();
    } catch {
      setDeleting(false);
    }
  }

  async function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value; // "YYYY-MM-DD" or ""
    setDueDate(value);
    setSavingDate(true);
    try {
      await fetch(`/api/ai/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dueDate: value || null }),
      });
      router.refresh();
    } catch {
      /* silent — user still sees the optimistic value */
    } finally {
      setSavingDate(false);
    }
  }

  return (
    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
      {/* Due date picker */}
      <div className="relative flex items-center">
        <Calendar
          size={11}
          className="absolute left-2 pointer-events-none"
          style={{ color: "var(--text-faint)" }}
        />
        <input
          type="date"
          value={dueDate}
          onChange={handleDateChange}
          disabled={savingDate}
          className="pl-6 pr-2 py-1 rounded-lg text-xs outline-none transition-all"
          style={{
            backgroundColor: "var(--bg-elevated)",
            color: "var(--text-muted)",
            border: "1px solid var(--border-subtle)",
            width: "130px",
            colorScheme: "dark",
          }}
        />
        {savingDate && (
          <Loader2
            size={10}
            className="absolute right-2 animate-spin"
            style={{ color: "var(--text-faint)" }}
          />
        )}
      </div>

      {/* Delete */}
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="flex h-6 w-6 items-center justify-center rounded-lg transition-all duration-150 disabled:opacity-40"
        style={{
          backgroundColor: "rgba(239,68,68,0.06)",
          color: "#f87171",
          border: "1px solid rgba(239,68,68,0.12)",
        }}
        title="Delete task"
      >
        {deleting ? (
          <Loader2 size={10} className="animate-spin" />
        ) : (
          <Trash2 size={10} />
        )}
      </button>
    </div>
  );
}
