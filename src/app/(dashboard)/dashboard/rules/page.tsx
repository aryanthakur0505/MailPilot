"use client";

// ==================================================
// MailPilot — Rules Page (Phase 7)
// ==================================================
// Displays user's automation rules with a toggle switch
// and a dialog to create new IF/THEN rules.

import { useState, useEffect, useCallback } from "react";
import { Zap, Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

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

const CATEGORY_BADGE_CLASS: Record<string, string> = {
  work: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  personal: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  newsletter: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  receipt: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  social: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  spam: "bg-red-500/10 text-red-600 dark:text-red-400",
  urgent: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
};

export default function RulesPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

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
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-amber-500/10">
            <Zap size={18} className="text-amber-600 dark:text-amber-400" strokeWidth={1.8} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Automation Rules</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {activeCount} active rule{activeCount !== 1 ? "s" : ""} · runs automatically after AI classification
            </p>
          </div>
        </div>
        <Button onClick={() => setShowModal(true)} className="gap-2">
          <Plus size={15} />
          New Rule
        </Button>
      </div>

      {/* How it works banner */}
      <div className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-muted-foreground">
        <Zap size={14} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
        <span>
          Rules fire automatically when the AI classifies an incoming email.{" "}
          <strong className="text-foreground">Only safe actions</strong>{" "}
          (archive, mark read, add label) are supported — no auto-delete or auto-reply.
        </span>
      </div>

      {/* Rules list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={20} className="animate-spin text-muted-foreground" />
        </div>
      ) : rules.length === 0 ? (
        <Card className="p-12 text-center">
          <Zap size={32} className="mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">No rules yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Create your first automation to take the admin work out of your inbox.
          </p>
          <Button variant="secondary" size="sm" onClick={() => setShowModal(true)} className="mt-4 gap-1.5">
            <Plus size={13} /> Create first rule
          </Button>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {rules.map((rule) => {
            const badgeClass = CATEGORY_BADGE_CLASS[rule.conditionValue] ?? CATEGORY_BADGE_CLASS.work;
            return (
              <Card
                key={rule.id}
                className={`flex flex-row flex-wrap items-center gap-4 p-4 ${rule.isActive ? "" : "opacity-55"}`}
              >
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">IF</span>
                  <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${badgeClass}`}>
                    {CATEGORY_LABELS[rule.conditionValue] ?? rule.conditionValue}
                  </span>
                </div>

                <span className="text-xs text-muted-foreground">→</span>

                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">THEN</span>
                  <Badge variant="secondary">
                    {ACTION_LABELS[rule.actionType] ?? rule.actionType}
                    {rule.actionValue ? ` "${rule.actionValue}"` : ""}
                  </Badge>
                </div>

                <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{rule.name}</span>

                <Switch
                  checked={rule.isActive}
                  disabled={toggling === rule.id}
                  onCheckedChange={() => handleToggle(rule)}
                  aria-label={rule.isActive ? "Pause rule" : "Activate rule"}
                />

                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleDelete(rule.id)}
                  disabled={deleting === rule.id}
                  className="text-muted-foreground hover:text-destructive"
                >
                  {deleting === rule.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                </Button>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Rule Dialog */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Automation Rule</DialogTitle>
            <DialogDescription>
              Define a condition and an action to run automatically.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="rule-name">Rule Name (optional)</Label>
              <Input
                id="rule-name"
                placeholder="e.g. Archive all newsletters"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold tracking-widest uppercase">IF Category is…</Label>
              <Select
                value={form.conditionValue}
                onValueChange={(value) => setForm({ ...form, conditionValue: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                    <SelectItem key={val} value={val}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold tracking-widest uppercase">THEN…</Label>
              <Select
                value={form.actionType}
                onValueChange={(value) => setForm({ ...form, actionType: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ACTION_LABELS).map(([val, label]) => (
                    <SelectItem key={val} value={val}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {form.actionType === "addLabel" && (
              <div className="space-y-1.5">
                <Label htmlFor="rule-label">Label Name</Label>
                <Input
                  id="rule-label"
                  placeholder="e.g. Finance"
                  value={form.actionValue}
                  onChange={(e) => setForm({ ...form, actionValue: e.target.value })}
                  required
                />
              </div>
            )}

            {formError && <p className="text-xs text-destructive">{formError}</p>}

            <DialogFooter className="-mx-0 -mb-0 border-0 bg-transparent p-0">
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={creating} className="gap-2">
                {creating ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                {creating ? "Creating…" : "Create Rule"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
