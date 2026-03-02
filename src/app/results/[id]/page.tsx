"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Brain, CheckCircle2, XCircle, ChevronDown, ChevronUp,
  RotateCcw, LayoutDashboard, Loader2, Trophy, TrendingUp, MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

interface QuestionResult {
  id: string;
  question_order: number;
  question: string;
  user_answer: string;
  ai_feedback: string;
  score: number;
}

interface FeedbackParsed {
  score: number;
  strengths: string;
  improvements: string;
  ideal_answer: string;
}

function parseFeedback(raw: string): FeedbackParsed {
  try {
    return JSON.parse(raw);
  } catch {
    return { score: 0, strengths: "", improvements: "", ideal_answer: "" };
  }
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 8 ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/30"
    : score >= 5 ? "text-amber-400 bg-amber-400/10 border-amber-400/30"
    : "text-red-400 bg-red-400/10 border-red-400/30";
  return (
    <span className={cn("px-3 py-1 rounded-full border text-sm font-bold", color)}>
      {score}/10
    </span>
  );
}

function QuestionCard({ result, index }: { result: QuestionResult; index: number }) {
  const [open, setOpen] = useState(index === 0);
  const feedback = parseFeedback(result.ai_feedback);

  return (
    <Card className="border-border/50 overflow-hidden">
      <button
        className="w-full text-left"
        onClick={() => setOpen((o) => !o)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <span className="shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                {index + 1}
              </span>
              <p className="text-sm font-medium leading-snug line-clamp-2">{result.question}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <ScoreBadge score={result.score} />
              {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </div>
          </div>
        </CardHeader>
      </button>

      {open && (
        <CardContent className="pt-0 space-y-4 border-t border-border/40">
          {/* User answer */}
          <div className="pt-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Your answer</p>
            {result.user_answer ? (
              <p className="text-sm leading-relaxed bg-muted/40 rounded-lg p-3">{result.user_answer}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">No answer provided.</p>
            )}
          </div>

          {/* Strengths */}
          {feedback.strengths && (
            <div className="flex gap-3">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-emerald-400 mb-1">Strengths</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{feedback.strengths}</p>
              </div>
            </div>
          )}

          {/* Improvements */}
          {feedback.improvements && (
            <div className="flex gap-3">
              <TrendingUp className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-amber-400 mb-1">Areas to improve</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{feedback.improvements}</p>
              </div>
            </div>
          )}

          {/* Ideal answer */}
          {feedback.ideal_answer && (
            <div className="flex gap-3">
              <MessageSquare className="h-4 w-4 text-violet-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-violet-400 mb-1">Model answer</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{feedback.ideal_answer}</p>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default function ResultsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [results, setResults] = useState<QuestionResult[]>([]);
  const [overallScore, setOverallScore] = useState<number | null>(null);
  const [interview, setInterview] = useState<{ role: string; difficulty: string; topic: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // Fetch interview
      const { data: iv } = await supabase.from("interviews").select("*").eq("id", id).single();
      if (!iv) { router.push("/dashboard"); return; }
      setInterview(iv);

      // Check if already evaluated
      const { data: qs } = await supabase
        .from("interview_questions")
        .select("*")
        .eq("interview_id", id)
        .order("question_order");

      const alreadyEvaluated = qs && qs.every((q: QuestionResult) => q.ai_feedback);

      if (alreadyEvaluated && iv.overall_score !== null) {
        setResults(qs ?? []);
        setOverallScore(iv.overall_score);
        setLoading(false);
        return;
      }

      // Run evaluation
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interviewId: id }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Failed to evaluate: " + data.error);
        setLoading(false);
        return;
      }
      setResults(data.results);
      setOverallScore(data.overallScore);
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-muted-foreground text-lg">AI is evaluating your answers…</p>
        <p className="text-muted-foreground text-sm">This may take up to 30 seconds</p>
      </div>
    );
  }

  const scoreColor =
    (overallScore ?? 0) >= 7 ? "text-emerald-400"
    : (overallScore ?? 0) >= 4 ? "text-amber-400"
    : "text-red-400";

  const scoreLabel =
    (overallScore ?? 0) >= 8 ? "Excellent"
    : (overallScore ?? 0) >= 6 ? "Good"
    : (overallScore ?? 0) >= 4 ? "Needs work"
    : "Keep practicing";

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="border-b border-border/40 px-6 py-4 flex items-center justify-between max-w-4xl mx-auto">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <span className="font-bold">MockMind</span>
        </Link>
        {interview && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="capitalize">{interview.role}</Badge>
            <Badge variant="outline">{interview.topic}</Badge>
          </div>
        )}
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Score hero */}
        <div className="rounded-2xl bg-gradient-to-br from-violet-900/30 to-cyan-900/20 border border-violet-500/20 p-10 text-center mb-10">
          <Trophy className={cn("h-12 w-12 mx-auto mb-4", scoreColor)} />
          <p className="text-muted-foreground text-sm uppercase tracking-widest mb-2">Overall score</p>
          <p className={cn("text-7xl font-black mb-2", scoreColor)}>{overallScore}</p>
          <p className="text-muted-foreground text-sm mb-1">out of 10</p>
          <Badge variant="secondary" className="text-sm px-4 py-1 mt-2">{scoreLabel}</Badge>

          <div className="mt-8 max-w-xs mx-auto">
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span>Score</span>
              <span>{overallScore}/10</span>
            </div>
            <Progress value={((overallScore ?? 0) / 10) * 100} className="h-2.5" />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            <Link href="/setup">
              <Button className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Practice again
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" className="gap-2">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Button>
            </Link>
          </div>
        </div>

        {/* Per-question results */}
        <h2 className="text-xl font-bold mb-6">Question breakdown</h2>
        <div className="space-y-4">
          {results.map((r, i) => (
            <QuestionCard key={r.id} result={r} index={i} />
          ))}
        </div>
      </main>
    </div>
  );
}
