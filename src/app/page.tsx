// ==================================================
// MailPilot — Landing Page
// ==================================================

import Link from "next/link";
import { Logo } from "@/components/layout/Logo";
import { Button } from "@/components/ui/Button";
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
    gradient: "from-blue-500 to-cyan-400",
  },
  {
    icon: Brain,
    title: "AI Understanding",
    description:
      "Summarize threads, detect priorities, and understand conversation context automatically.",
    gradient: "from-violet-500 to-purple-400",
  },
  {
    icon: PenLine,
    title: "Smart Drafts",
    description:
      "Generate personalized reply drafts that match your writing style. You always control Send.",
    gradient: "from-indigo-500 to-blue-400",
  },
  {
    icon: ListTodo,
    title: "Task Extraction",
    description:
      "Automatically extract deadlines, action items, and follow-ups from your email threads.",
    gradient: "from-emerald-500 to-teal-400",
  },
  {
    icon: Zap,
    title: "Workflow Automation",
    description:
      "Smart categorization, priority scoring, and automated organization that learns from you.",
    gradient: "from-amber-500 to-orange-400",
  },
  {
    icon: BarChart3,
    title: "Productivity Analytics",
    description:
      "Track response times, email volume, and AI-assisted time savings with detailed dashboards.",
    gradient: "from-pink-500 to-rose-400",
  },
];

export default function LandingPage() {
  return (
    <div className="bg-mesh min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Logo size="md" />
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Log in
              </Button>
            </Link>
            <Link href="/login">
              <Button size="sm">
                Get Started
                <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-6 pt-16 text-center">
        {/* Ambient glow */}
        <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2">
          <div className="h-[500px] w-[800px] rounded-full bg-indigo-500/10 blur-[120px]" />
        </div>

        <div className="relative z-10 max-w-4xl">
          {/* Badge */}
          <div className="animate-fade-in mb-8 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-sm text-indigo-300">
            <Sparkles size={14} />
            AI-Powered Email Intelligence
          </div>

          {/* Heading */}
          <h1 className="animate-fade-in delay-100 mb-6 text-5xl font-extrabold leading-tight tracking-tight text-white md:text-7xl"
              style={{ animationFillMode: 'backwards' }}>
            Your inbox,{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
              on autopilot
            </span>
          </h1>

          {/* Subheading */}
          <p className="animate-fade-in delay-200 mx-auto mb-10 max-w-2xl text-lg text-slate-400 md:text-xl"
             style={{ animationFillMode: 'backwards' }}>
            MailPilot connects your Gmail and Outlook, understands your
            conversations, generates smart replies, and extracts tasks —
            while you stay in full control.
          </p>

          {/* CTA Buttons */}
          <div className="animate-fade-in delay-300 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
               style={{ animationFillMode: 'backwards' }}>
            <Link href="/login">
              <Button size="lg">
                <Mail size={20} />
                Connect Your Inbox
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="secondary" size="lg">
                See How It Works
              </Button>
            </Link>
          </div>

          {/* Trust line */}
          <div className="animate-fade-in delay-400 mt-8 flex items-center justify-center gap-2 text-sm text-slate-500"
               style={{ animationFillMode: 'backwards' }}>
            <Shield size={14} />
            <span>You control every action. AI never sends without your approval.</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative px-6 py-32">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
              Everything your inbox needs
            </h2>
            <p className="mx-auto max-w-xl text-lg text-slate-400">
              Powerful AI features that work behind the scenes, so you can focus
              on what matters.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 p-8 backdrop-blur-sm transition-all duration-300 hover:border-slate-700 hover:bg-slate-900/80 hover:shadow-xl hover:shadow-indigo-500/5"
                style={{
                  animationDelay: `${i * 100}ms`,
                }}
              >
                {/* Icon */}
                <div
                  className={`mb-5 inline-flex rounded-xl bg-gradient-to-br ${feature.gradient} p-3 shadow-lg`}
                >
                  <feature.icon size={24} className="text-white" />
                </div>

                {/* Content */}
                <h3 className="mb-2 text-lg font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-slate-400">
                  {feature.description}
                </p>

                {/* Hover glow */}
                <div className="absolute -bottom-2 -right-2 h-32 w-32 rounded-full bg-indigo-500/0 blur-2xl transition-all duration-500 group-hover:bg-indigo-500/10" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="border-t border-slate-800/50 px-6 py-32">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
            AI assists. You decide.
          </h2>
          <p className="mx-auto mb-16 max-w-xl text-lg text-slate-400">
            MailPilot analyzes and suggests. You always have the final word.
          </p>

          <div className="flex flex-col items-center gap-4 md:flex-row md:justify-center">
            {[
              { step: "1", label: "Connect", desc: "Link Gmail or Outlook" },
              { step: "2", label: "AI Analyzes", desc: "Categorize & prioritize" },
              { step: "3", label: "Review", desc: "Check AI suggestions" },
              { step: "4", label: "Act", desc: "You click Send" },
            ].map((item, i) => (
              <div key={item.step} className="flex items-center gap-4">
                <div className="flex flex-col items-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-xl font-bold text-white shadow-lg shadow-indigo-500/25">
                    {item.step}
                  </div>
                  <p className="mt-3 font-semibold text-white">{item.label}</p>
                  <p className="text-sm text-slate-500">{item.desc}</p>
                </div>
                {i < 3 && (
                  <ArrowRight
                    size={20}
                    className="hidden text-slate-600 md:block"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-slate-800/50 px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-white">
            Ready to take control of your inbox?
          </h2>
          <p className="mb-8 text-lg text-slate-400">
            Start using MailPilot today. Connect in seconds.
          </p>
          <Link href="/login">
            <Button size="lg">
              Get Started Free
              <ArrowRight size={18} />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 px-6 py-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Logo size="sm" />
          <p className="text-sm text-slate-600">
            © {new Date().getFullYear()} MailPilot. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
