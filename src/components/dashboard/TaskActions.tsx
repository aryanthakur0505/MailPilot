"use client";

// ==================================================
// MailPilot — Task Actions (Client Component)
// ==================================================
// Per-task row: delete button + inline due date picker.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    <div className="flex items-center gap-1.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
      <div className="relative flex items-center">
        <Input
          type="date"
          value={dueDate}
          onChange={handleDateChange}
          disabled={savingDate}
          className="h-7 w-[132px] pr-6 text-xs"
        />
        {savingDate && (
          <Loader2 size={10} className="absolute right-2 animate-spin text-muted-foreground" />
        )}
      </div>

      <Button
        variant="destructive"
        size="icon-xs"
        onClick={handleDelete}
        disabled={deleting}
        title="Delete task"
      >
        {deleting ? <Loader2 size={10} className="animate-spin" /> : <Trash2 size={10} />}
      </Button>
    </div>
  );
}
