"use client";

// ==================================================
// MailPilot — Task Checkbox (Client Component)
// ==================================================

import { useState } from "react";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";

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
    <button
      onClick={toggle}
      disabled={loading}
      className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full transition-all duration-200 mt-0.5"
      style={{
        backgroundColor: completed ? "rgba(52,211,153,0.15)" : "transparent",
        border: completed
          ? "1.5px solid #34d399"
          : "1.5px solid var(--border-default)",
      }}
    >
      {completed && <Check size={10} style={{ color: "#34d399" }} strokeWidth={3} />}
    </button>
  );
}
