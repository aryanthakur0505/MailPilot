"use client";

// ==================================================
// MailPilot — Rules Page (Phase 7)
// ==================================================
// Displays user's automation rules with a toggle switch
// and a modal to create new IF/THEN rules.

import { useState, useEffect, useCallback } from "react";
import {
  Zap,
  Plus,
  Trash2,
  Loader2,
  X,
  ChevronDown,
  CheckCircle2,
  Circle,
} from "lucide-react";

interface Rule {
  id: string;
  name: string;
  conditionField: string;
  conditionValue: string;
  actionType: string;
  actionValue: string | null;
  isActive: boolean;
  createdAt: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  work: "Work",
  personal: "Personal",
  newsletter: "Newsletter",
  receipt: "Receipt",
  social: "Social",
  spam: "Spam",
  urgent: "Urgent",
};

const ACTION_LABELS: Record<string, string> = {
  archive: "Archive it",
  markRead: "Mark as Read",
  addLabel: "Add Label…",
};

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  work:       { bg: "rgba(99,102,241,0.1)",  text: "#818cf8", border: "rgba(99,102,241,0.2)" },
  personal:   { bg: "rgba(52,211,153,0.1)",  text: "#34d399", border: "rgba(52,211,153,0.2)" },
  newsletter: { bg: "rgba(251,191,36,0.1)",  text: "#fbbf24", border: "rgba(251,191,36,0.2)" },
  receipt:    { bg: "rgba(167,139,250,0.1)", text: "#a78bfa", border: "rgba(167,139,250,0.2)" },
  social:     { bg: "rgba(96,165,250,0.1)",  text: "#60a5fa", border: "rgba(96,165,250,0.2)" },
  spam:       { bg: "rgba(239,68,68,0.1)",   text: "#f87171", border: "rgba(239,68,68,0.2)"  },
  urgent:     { bg: "rgba(251,146,60,0.1)",  text: "#fb923c", border: "rgba(251,146,60,0.2)" },
};

export default function RulesPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    name: "",
    conditionValue: "newsletter",
    actionType: "archive",
    actionValue: "",
  });
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/rules");
      if (res.ok) {
        const data = await res.json();
        setRules(data.rules ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  async function handleToggle(rule: Rule) {
    setToggling(rule.id);
    await fetch(`/api/rules/${rule.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !rule.isActive }),
    });
    setRules((prev) =>
      prev.map((r) => (r.id === rule.id ? { ...r, isActive: !r.isActive } : r))
    );
    setToggling(null);
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    await fetch(`/api/rules/${id}`, { method: "DELETE" });
    setRules((prev) => prev.filter((r) => r.id !== id));
    setDeleting(null);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setFormError("");

    try {
      const res = await fetch("/api/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name || `If ${CATEGORY_LABELS[form.conditionValue]} → ${ACTION_LABELS[form.actionType]}`,
          conditionValue: form.conditionValue,
          actionType: form.actionType,
          actionValue: form.actionType === "addLabel" ? form.actionValue : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create rule");

      setRules((prev) => [data.rule, ...prev]);
      setShowModal(false);
      setForm({ name: "", conditionValue: "newsletter", actionType: "archive", actionValue: "" });
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setCreating(false);
    }
  }

  const activeCount = rules.filter((r) => r.isActive).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{
              background: "linear-gradient(135deg, rgba(251,191,36,0.15), rgba(251,146,60,0.1))",
              border: "1px solid rgba(251,191,36,0.2)",
            }}
          >
            <Zap size={18} style={{ color: "#fbbf24" }} strokeWidth={1.8} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
              Automation Rules
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
              {activeCount} active rule{activeCount !== 1 ? "s" : ""} · runs automatically after AI classification
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-150 active:scale-[0.97]"
          style={{
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            color: "white",
            boxShadow: "0 4px 12px rgba(99,102,241,0.3)",
          }}
        >
          <Plus size={15} />
          New Rule
        </button>
      </div>

      {/* How it works banner */}
      <div
        className="rounded-xl px-4 py-3 flex items-start gap-3 text-sm"
        style={{
          backgroundColor: "rgba(251,191,36,0.04)",
          border: "1px solid rgba(251,191,36,0.1)",
          color: "var(--text-muted)",
        }}
      >
        <Zap size={14} className="mt-0.5 shrink-0" style={{ color: "#fbbf24" }} />
        <span>
          Rules fire automatically when the AI classifies an incoming email.{" "}
          <strong style={{ color: "var(--text-secondary)" }}>Only safe actions</strong>{" "}
          (archive, mark read, add label) are supported — no auto-delete or auto-reply.
        </span>
      </div>

      {/* Rules list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={20} className="animate-spin" style={{ color: "var(--text-muted)" }} />
        </div>
      ) : rules.length === 0 ? (
        <div
          className="rounded-2xl p-12 text-center"
          style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
        >
          <Zap size={32} className="mx-auto mb-3" style={{ color: "var(--text-faint)" }} />
          <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>No rules yet</p>
          <p className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>
            Create your first automation to take the admin work out of your inbox.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-all"
            style={{ backgroundColor: "rgba(99,102,241,0.1)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.15)" }}
          >
            <Plus size={13} /> Create first rule
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {rules.map((rule) => {
            const catColor = CATEGORY_COLORS[rule.conditionValue] ?? CATEGORY_COLORS.work;
            return (
              <div
                key={rule.id}
                className="flex items-center gap-4 rounded-2xl px-5 py-4 transition-all duration-150"
                style={{
                  backgroundColor: "var(--bg-card)",
                  border: `1px solid ${rule.isActive ? "var(--border-subtle)" : "var(--border-subtle)"}`,
                  opacity: rule.isActive ? 1 : 0.55,
                }}
              >
                {/* IF badge */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>IF</span>
                  <span
                    className="rounded-lg px-2.5 py-1 text-xs font-semibold"
                    style={{ backgroundColor: catColor.bg, color: catColor.text, border: `1px solid ${catColor.border}` }}
                  >
                    {CATEGORY_LABELS[rule.conditionValue] ?? rule.conditionValue}
                  </span>
                </div>

                <span className="text-xs" style={{ color: "var(--text-faint)" }}>→</span>

                {/* THEN badge */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>THEN</span>
                  <span
                    className="rounded-lg px-2.5 py-1 text-xs font-semibold"
                    style={{ backgroundColor: "rgba(99,102,241,0.08)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.15)" }}
                  >
                    {ACTION_LABELS[rule.actionType] ?? rule.actionType}
                    {rule.actionValue ? ` "${rule.actionValue}"` : ""}
                  </span>
                </div>

                {/* Name */}
                <span className="flex-1 text-sm truncate" style={{ color: "var(--text-secondary)" }}>
                  {rule.name}
                </span>

                {/* Toggle */}
                <button
                  onClick={() => handleToggle(rule)}
                  disabled={toggling === rule.id}
                  className="shrink-0 transition-all"
                  title={rule.isActive ? "Pause rule" : "Activate rule"}
                >
                  {toggling === rule.id ? (
                    <Loader2 size={16} className="animate-spin" style={{ color: "var(--text-faint)" }} />
                  ) : rule.isActive ? (
                    <CheckCircle2 size={18} style={{ color: "#34d399" }} />
                  ) : (
                    <Circle size={18} style={{ color: "var(--text-faint)" }} />
                  )}
                </button>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(rule.id)}
                  disabled={deleting === rule.id}
                  className="shrink-0 rounded-lg p-1.5 transition-all hover:bg-[rgba(239,68,68,0.08)]"
                  style={{ color: "var(--text-faint)" }}
                >
                  {deleting === rule.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Rule Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6 shadow-2xl"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                Create Automation Rule
              </h2>
              <button onClick={() => setShowModal(false)} style={{ color: "var(--text-muted)" }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              {/* Rule Name */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>
                  Rule Name (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Archive all newsletters"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all"
                  style={{
                    backgroundColor: "var(--bg-elevated)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              {/* IF condition */}
              <div>
                <label className="block text-xs font-bold mb-1.5 uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>
                  IF Category is…
                </label>
                <div className="relative">
                  <select
                    value={form.conditionValue}
                    onChange={(e) => setForm({ ...form, conditionValue: e.target.value })}
                    className="w-full appearance-none rounded-xl px-3.5 py-2.5 text-sm outline-none pr-8"
                    style={{
                      backgroundColor: "var(--bg-elevated)",
                      border: "1px solid var(--border-subtle)",
                      color: "var(--text-primary)",
                    }}
                  >
                    {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-3 pointer-events-none" style={{ color: "var(--text-faint)" }} />
                </div>
              </div>

              {/* THEN action */}
              <div>
                <label className="block text-xs font-bold mb-1.5 uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>
                  THEN…
                </label>
                <div className="relative">
                  <select
                    value={form.actionType}
                    onChange={(e) => setForm({ ...form, actionType: e.target.value })}
                    className="w-full appearance-none rounded-xl px-3.5 py-2.5 text-sm outline-none pr-8"
                    style={{
                      backgroundColor: "var(--bg-elevated)",
                      border: "1px solid var(--border-subtle)",
                      color: "var(--text-primary)",
                    }}
                  >
                    {Object.entries(ACTION_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-3 pointer-events-none" style={{ color: "var(--text-faint)" }} />
                </div>
              </div>

              {/* Label name (only for addLabel) */}
              {form.actionType === "addLabel" && (
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>
                    Label Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Finance"
                    value={form.actionValue}
                    onChange={(e) => setForm({ ...form, actionValue: e.target.value })}
                    required
                    className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none"
                    style={{
                      backgroundColor: "var(--bg-elevated)",
                      border: "1px solid var(--border-subtle)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>
              )}

              {formError && (
                <p className="text-xs" style={{ color: "#f87171" }}>{formError}</p>
              )}

              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-xl py-2.5 text-sm font-medium transition-all"
                  style={{
                    backgroundColor: "var(--bg-elevated)",
                    color: "var(--text-secondary)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all active:scale-[0.97]"
                  style={{
                    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                    color: "white",
                  }}
                >
                  {creating ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                  {creating ? "Creating…" : "Create Rule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
