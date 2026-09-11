"use client";

// ==================================================
// MailPilot — Task Checkbox (Client Component)
// ==================================================

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";

interface TaskCheckboxProps {
  taskId: string;
  completed: boolean;
}

export function TaskCheckbox({ taskId, completed: initialCompleted }: TaskCheckboxProps) {
  const router = useRouter();
  const [completed, setCompleted] = useState(initialCompleted);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const next = !completed;
    setCompleted(next); // optimistic update
    try {
      await fetch(`/api/ai/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: next }),
      });
      router.refresh();
    } catch {
      setCompleted(!next); // revert on failure
    } finally {
      setLoading(false);
    }
  }

  return (
    <Checkbox
      checked={completed}
      disabled={loading}
      onCheckedChange={toggle}
      className="mt-0.5 shrink-0"
    />
  );
}
