// ==================================================
// MailPilot — Landing Page
// ==================================================

import Link from "next/link";
import { Logo } from "@/components/layout/Logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Mail,
  Brain,
  Zap,
  Shield,
  Sparkles,
  ArrowRight,
  Inbox,
  PenLine,
  ListTodo,
  BarChart3,
} from "lucide-react";

const features = [
  {
    icon: Inbox,
    title: "Unified Inbox",
    description:
      "Connect Gmail and Outlook in one place. See all your emails without switching tabs.",
  },
  {
    icon: Brain,
    title: "AI Understanding",
    description:
      "Summarize threads, detect priorities, and understand conversation context automatically.",
  },
  {
    icon: PenLine,
    title: "Smart Drafts",
    description:
      "Generate personalized reply drafts that match your writing style. You always control Send.",
  },
  {
    icon: ListTodo,
    title: "Task Extraction",
    description:
      "Automatically extract deadlines, action items, and follow-ups from your email threads.",
  },
  {
    icon: Zap,
    title: "Workflow Automation",
    description:
      "Smart categorization, priority scoring, and automated organization that learns from you.",
  },
  {
    icon: BarChart3,
    title: "Productivity Analytics",
    description:
      "Track response times, email volume, and AI-assisted time savings with detailed dashboards.",
  },
];

const steps = [
  { step: "1", label: "Connect", desc: "Link Gmail or Outlook" },
  { step: "2", label: "AI Analyzes", desc: "Categorize & prioritize" },
  { step: "3", label: "Review", desc: "Check AI suggestions" },
  { step: "4", label: "Act", desc: "You click Send" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Logo size="md" />
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Log in
              </Button>
            </Link>
            <Link href="/login">
              <Button size="sm" className="gap-1.5">
                Get Started
                <ArrowRight size={15} />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-6 py-28 text-center sm:py-36">
        <div className="max-w-3xl">
          <Badge variant="secondary" className="mb-6 gap-1.5 rounded-full px-3 py-1">
            <Sparkles size={13} />
            AI-Powered Email Intelligence
          </Badge>

          <h1 className="mb-6 text-4xl leading-tight font-semibold tracking-tight sm:text-6xl">
            Your inbox, <span className="text-primary">on autopilot</span>
          </h1>

          <p className="mx-auto mb-10 max-w-xl text-lg text-muted-foreground">
            MailPilot connects your Gmail and Outlook, understands your
            conversations, generates smart replies, and extracts tasks —
            while you stay in full control.
          </p>

          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/login">
              <Button size="lg" className="gap-2">
                <Mail size={18} />
                Connect Your Inbox
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="outline" size="lg">
                See How It Works
              </Button>
            </Link>
          </div>

          <div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Shield size={14} />
            <span>You control every action. AI never sends without your approval.</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 text-center">
            <h2 className="mb-3 text-3xl font-semibold tracking-tight">
              Everything your inbox needs
            </h2>
            <p className="mx-auto max-w-xl text-muted-foreground">
              Powerful AI features that work behind the scenes, so you can focus
              on what matters.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} className="p-6">
                <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon size={20} className="text-primary" strokeWidth={1.8} />
                </div>
                <h3 className="mb-1.5 font-semibold">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t px-6 py-24">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-3 text-3xl font-semibold tracking-tight">
            AI assists. You decide.
          </h2>
          <p className="mx-auto mb-14 max-w-xl text-muted-foreground">
            MailPilot analyzes and suggests. You always have the final word.
          </p>

          <div className="flex flex-col items-center gap-4 md:flex-row md:justify-center">
            {steps.map((item, i) => (
              <div key={item.step} className="flex items-center gap-4">
                <div className="flex flex-col items-center">
                  <div className="flex size-12 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
                    {item.step}
                  </div>
                  <p className="mt-3 font-medium">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
                {i < steps.length - 1 && (
                  <ArrowRight size={18} className="hidden text-muted-foreground/50 md:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-3 text-3xl font-semibold tracking-tight">
            Ready to take control of your inbox?
          </h2>
          <p className="mb-8 text-muted-foreground">
            Start using MailPilot today. Connect in seconds.
          </p>
          <Link href="/login">
            <Button size="lg" className="gap-2">
              Get Started Free
              <ArrowRight size={18} />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-6 py-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Logo size="sm" />
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} MailPilot. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
