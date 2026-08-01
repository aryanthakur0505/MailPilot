"use client";

// ==================================================
// MailPilot — Add Task Form (Client Component)
// ==================================================
// Inline form to manually create a task.
// Appends to the top of the Tasks page.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Calendar } from "lucide-react";

export function AddTaskForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ai/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          dueDate: dueDate || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create task");
      }
      setTitle("");
      setDueDate("");
      setOpen(false);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-150 active:scale-[0.97]"
        style={{
          backgroundColor: "rgba(99,102,241,0.08)",
          color: "#818cf8",
          border: "1px solid rgba(99,102,241,0.15)",
        }}
      >
        <Plus size={14} />
        Add Task
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl p-4 space-y-3"
      style={{
        backgroundColor: "var(--bg-card)",
        border: "1px solid rgba(99,102,241,0.2)",
      }}
    >
      {/* Title input */}
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task title..."
        className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
        style={{
          backgroundColor: "var(--bg-elevated)",
          color: "var(--text-primary)",
          border: "1px solid var(--border-subtle)",
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-subtle)")}
      />

      {/* Due date + actions row */}
      <div className="flex items-center gap-2">
        <div className="relative flex items-center">
          <Calendar
            size={12}
            className="absolute left-2.5 pointer-events-none"
            style={{ color: "var(--text-faint)" }}
          />
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="pl-7 pr-3 py-2 rounded-xl text-xs outline-none transition-all"
            style={{
              backgroundColor: "var(--bg-elevated)",
              color: "var(--text-muted)",
              border: "1px solid var(--border-subtle)",
              colorScheme: "dark",
            }}
          />
        </div>

        <div className="flex-1" />

        {/* Cancel */}
        <button
          type="button"
          onClick={() => { setOpen(false); setTitle(""); setDueDate(""); setError(""); }}
          className="rounded-xl px-3 py-2 text-xs font-medium transition-all"
          style={{
            backgroundColor: "var(--bg-elevated)",
            color: "var(--text-muted)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          Cancel
        </button>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !title.trim()}
          className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-all disabled:opacity-40"
          style={{
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            color: "white",
            boxShadow: "0 2px 8px rgba(99,102,241,0.3)",
          }}
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
          {loading ? "Adding..." : "Add Task"}
        </button>
      </div>

      {error && (
        <p className="text-xs" style={{ color: "#f87171" }}>
          {error}
        </p>
      )}
    </form>
  );
}
