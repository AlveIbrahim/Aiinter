"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Brain,
  Plus,
  LogOut,
  Trophy,
  Target,
  BarChart3,
  Clock,
  ChevronRight,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Interview {
  id: string;
  role: string;
  difficulty: string;
  topic: string;
  num_questions: number;
  status: string;
  overall_score: number | null;
  created_at: string;
}

function ScoreDisplay({ score }: { score: number | null }) {
  if (score === null)
    return <span className="text-muted-foreground text-sm">Pending</span>;
  const color =
    score >= 7
      ? "text-emerald-400"
      : score >= 4
      ? "text-amber-400"
      : "text-red-400";
  return (
    <span className={cn("font-bold text-lg", color)}>
      {score}
      <span className="text-xs text-muted-foreground font-normal">/10</span>
    </span>
  );
}

const ROLE_LABELS: Record<string, string> = {
  frontend: "Frontend",
  backend: "Backend",
  fullstack: "Full Stack",
  "system-design": "System Design",
};

function InterviewCard({ interview }: { interview: Interview }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const formattedDate = mounted
    ? new Date(interview.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

  return (
    <Card className="border-border/50 hover:border-primary/30 transition-all overflow-hidden group">
      <Link href={interview.status === "completed" ? `/results/${interview.id}` : `/interview/${interview.id}`}>
        <CardContent className="p-0">
          <div className="p-5 flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="font-bold text-lg leading-none">
                  {ROLE_LABELS[interview.role] || interview.role}
                </p>
                <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider px-1.5 h-4">
                  {interview.difficulty}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{interview.topic}</p>
            </div>
            <ScoreDisplay score={interview.overall_score} />
          </div>

          <div className="px-5 py-3 bg-muted/30 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-1 group-hover:text-primary transition-colors">
              <span>{interview.status === "completed" ? "View results" : "Continue"}</span>
              <ChevronRight className="h-3 w-3" />
            </div>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}

export default function DashboardClient({
  interviews,
  userEmail,
}: {
  interviews: Interview[];
  userEmail: string;
}) {
  const router = useRouter();
  const supabase = createClient();

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const completedInterviews = interviews.filter(
    (i) => i.status === "completed" && i.overall_score !== null
  );
  const avgScore =
    completedInterviews.length > 0
      ? Math.round(
          (completedInterviews.reduce(
            (acc, i) => acc + (i.overall_score ?? 0),
            0
          ) /
            completedInterviews.length) *
            10
        ) / 10
      : null;
  const bestScore =
    completedInterviews.length > 0
      ? Math.max(...completedInterviews.map((i) => i.overall_score ?? 0))
      : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="border-b border-border/40 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">MockMind</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {userEmail}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="gap-2 text-muted-foreground"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold mb-1">Dashboard</h1>
            <p className="text-muted-foreground">
              Track your interview practice progress
            </p>
          </div>
          <Link href="/setup">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New interview
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4 mb-10">
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Target className="h-4 w-4" /> Total interviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{interviews.length}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {completedInterviews.length} completed
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <BarChart3 className="h-4 w-4" /> Average score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p
                className={cn(
                  "text-3xl font-bold",
                  avgScore !== null && avgScore >= 7
                    ? "text-emerald-400"
                    : avgScore !== null && avgScore >= 4
                    ? "text-amber-400"
                    : "text-muted-foreground"
                )}
              >
                {avgScore !== null ? avgScore : "—"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">out of 10</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Trophy className="h-4 w-4" /> Best score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p
                className={cn(
                  "text-3xl font-bold",
                  bestScore !== null && bestScore >= 7
                    ? "text-emerald-400"
                    : bestScore !== null
                    ? "text-amber-400"
                    : "text-muted-foreground"
                )}
              >
                {bestScore !== null ? bestScore : "—"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                personal best
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Interview list */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Interview history</h2>

          {interviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {interviews.map((interview) => (
                <InterviewCard key={interview.id} interview={interview} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border/60 p-16 text-center">
              <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-40" />
              <p className="font-semibold mb-2">No interviews yet</p>
              <p className="text-muted-foreground text-sm mb-6">
                Start your first mock interview to see your results here.
              </p>
              <Link href="/setup">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Start first interview
                </Button>
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
