"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Brain, Code2, Cpu, Layers, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";

const ROLES = [
  { id: "frontend", label: "Frontend Engineer", icon: Code2, topics: ["React & Hooks", "TypeScript", "CSS & Layout", "Performance", "Testing"] },
  { id: "backend", label: "Backend Engineer", icon: Cpu, topics: ["Node.js & APIs", "Databases & SQL", "Authentication", "Caching", "Microservices"] },
  { id: "fullstack", label: "Full Stack", icon: Layers, topics: ["End-to-end architecture", "DevOps basics", "REST & GraphQL", "State management"] },
  { id: "system-design", label: "System Design", icon: Brain, topics: ["Scalability patterns", "CAP theorem", "Load balancing", "Distributed systems", "Database design"] },
];

const DIFFICULTIES = [
  { id: "junior", label: "Junior", desc: "0–2 years experience" },
  { id: "mid", label: "Mid-level", desc: "2–5 years experience" },
  { id: "senior", label: "Senior", desc: "5+ years experience" },
];

const QUESTION_COUNTS = [3, 5, 10];

export default function SetupPage() {
  const router = useRouter();
  const [role, setRole] = useState("");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("mid");
  const [numQuestions, setNumQuestions] = useState(5);
  const [loading, setLoading] = useState(false);

  const selectedRole = ROLES.find((r) => r.id === role);

  async function handleStart() {
    if (!role || !topic) {
      toast.error("Please select a role and topic.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const { data, error } = await supabase
      .from("interviews")
      .insert({ user_id: user.id, role, difficulty, topic, num_questions: numQuestions, status: "in_progress" })
      .select()
      .single();

    if (error || !data) {
      toast.error("Failed to start interview. Please try again.");
      setLoading(false);
      return;
    }

    router.push(`/interview/${data.id}`);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="border-b border-border/40 px-6 py-4 flex items-center justify-between max-w-5xl mx-auto">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <span className="font-bold text-lg">MockMind</span>
        </Link>
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">Dashboard</Button>
        </Link>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-2">Configure your interview</h1>
          <p className="text-muted-foreground">Choose your track, difficulty, and how many questions you want.</p>
        </div>

        {/* Step 1: Role */}
        <section className="mb-10">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">1. Select your role</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ROLES.map((r) => (
              <button
                key={r.id}
                onClick={() => { setRole(r.id); setTopic(""); }}
                className={cn(
                  "text-left rounded-xl border p-4 transition-all hover:border-primary/60",
                  role === r.id ? "border-primary bg-primary/10" : "border-border/50 bg-card"
                )}
              >
                <r.icon className={cn("h-6 w-6 mb-3", role === r.id ? "text-primary" : "text-muted-foreground")} />
                <p className={cn("font-semibold text-sm", role === r.id ? "text-primary" : "")}>{r.label}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Step 2: Topic */}
        {selectedRole && (
          <section className="mb-10">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">2. Choose a topic</h2>
            <div className="flex flex-wrap gap-3">
              {selectedRole.topics.map((t) => (
                <button
                  key={t}
                  onClick={() => setTopic(t)}
                  className={cn(
                    "px-4 py-2 rounded-full border text-sm font-medium transition-all",
                    topic === t
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/50 bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Step 3: Difficulty */}
        <section className="mb-10">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">3. Difficulty level</h2>
          <div className="flex flex-wrap gap-4">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.id}
                onClick={() => setDifficulty(d.id)}
                className={cn(
                  "rounded-xl border p-4 w-40 text-left transition-all",
                  difficulty === d.id ? "border-primary bg-primary/10" : "border-border/50 bg-card hover:border-primary/40"
                )}
              >
                <p className={cn("font-semibold text-sm", difficulty === d.id ? "text-primary" : "")}>{d.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{d.desc}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Step 4: Question count */}
        <section className="mb-12">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">4. Number of questions</h2>
          <div className="flex gap-4">
            {QUESTION_COUNTS.map((n) => (
              <button
                key={n}
                onClick={() => setNumQuestions(n)}
                className={cn(
                  "w-16 h-16 rounded-xl border font-bold text-lg transition-all",
                  numQuestions === n ? "border-primary bg-primary/10 text-primary" : "border-border/50 bg-card text-muted-foreground hover:border-primary/40"
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </section>

        {/* Summary & Start */}
        <Card className="border-border/50 bg-card/60">
          <CardContent className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <p className="font-semibold mb-2">Interview summary</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{role ? ROLES.find(r => r.id === role)?.label : "No role selected"}</Badge>
                <Badge variant="secondary">{topic || "No topic selected"}</Badge>
                <Badge variant="secondary">{DIFFICULTIES.find(d => d.id === difficulty)?.label}</Badge>
                <Badge variant="secondary">{numQuestions} questions</Badge>
              </div>
            </div>
            <Button
              size="lg"
              onClick={handleStart}
              disabled={loading || !role || !topic}
              className="gap-2 shrink-0"
            >
              {loading ? "Starting..." : "Start interview"}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
