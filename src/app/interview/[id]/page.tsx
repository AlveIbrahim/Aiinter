"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Brain, Mic, MicOff, Volume2, ChevronRight, Loader2, StopCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

interface InterviewData {
  id: string;
  role: string;
  difficulty: string;
  topic: string;
  num_questions: number;
  status: string;
}

interface Question {
  id: string;
  question_order: number;
  question: string;
  user_answer?: string;
}

type Phase = "loading" | "ready" | "speaking" | "listening" | "processing" | "done";

export default function InterviewRoom() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [interview, setInterview] = useState<InterviewData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("loading");
  const [transcript, setTranscript] = useState("");
  const [answers, setAnswers] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<{ stop: () => void } | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const interimRef = useRef("");

  // ── Load interview + generate questions ──────────────────────────
  useEffect(() => {
    async function init() {
      const { data: iv, error: ivErr } = await supabase
        .from("interviews")
        .select("*")
        .eq("id", id)
        .single();

      if (ivErr || !iv) {
        toast.error("Interview not found.");
        router.push("/dashboard");
        return;
      }
      setInterview(iv);

      // Check if questions already exist (resume)
      const { data: existing } = await supabase
        .from("interview_questions")
        .select("*")
        .eq("interview_id", id)
        .order("question_order");

      if (existing && existing.length > 0) {
        setQuestions(existing);
        // Find first unanswered
        const firstUnanswered = existing.findIndex((q: Question) => !q.user_answer);
        setCurrentIndex(firstUnanswered === -1 ? existing.length - 1 : firstUnanswered);
        setPhase("ready");
      } else {
        // Generate fresh questions
        setIsGenerating(true);
        const res = await fetch("/api/generate-questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            interviewId: id,
            role: iv.role,
            difficulty: iv.difficulty,
            topic: iv.topic,
            numQuestions: iv.num_questions,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error("Failed to generate questions: " + data.error);
          setIsGenerating(false);
          return;
        }
        // Re-fetch from DB to get IDs
        const { data: qs } = await supabase
          .from("interview_questions")
          .select("*")
          .eq("interview_id", id)
          .order("question_order");
        setQuestions(qs ?? []);
        setIsGenerating(false);
        setPhase("ready");
      }
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ── TTS: speak current question ──────────────────────────────────
  const speakQuestion = useCallback(async (text: string) => {
    setPhase("speaking");
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) {
        // Fallback to browser TTS
        const utter = new SpeechSynthesisUtterance(text);
        utter.rate = 0.95;
        utter.onend = () => setPhase("listening");
        window.speechSynthesis.speak(utter);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        URL.revokeObjectURL(url);
        setPhase("listening");
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        setPhase("listening");
      };
      audio.play();
    } catch {
      setPhase("listening");
    }
  }, []);

  // ── Start listening via Web Speech API ──────────────────────────
  const startListening = useCallback(() => {
    type SpeechRecognitionCtor = new () => {
      continuous: boolean;
      interimResults: boolean;
      lang: string;
      start: () => void;
      stop: () => void;
      onresult: ((event: {
        resultIndex: number;
        results: { isFinal: boolean; [k: number]: { transcript: string } }[];
      }) => void) | null;
      onerror: (() => void) | null;
    };
    const SpeechRecognitionAPI: SpeechRecognitionCtor | undefined =
      (window as unknown as { SpeechRecognition?: SpeechRecognitionCtor }).SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: SpeechRecognitionCtor }).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      toast.error("Speech recognition not supported in this browser. Please use Chrome.");
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    interimRef.current = "";

    recognition.onresult = (event: {
      resultIndex: number;
      results: { isFinal: boolean; [k: number]: { transcript: string } }[];
    }) => {
      let interim = "";
      let final = interimRef.current;
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript + " ";
        } else {
          interim = result[0].transcript;
        }
      }
      interimRef.current = final;
      setTranscript(final + interim);
    };

    recognition.onerror = () => {
      // Ignore errors, keep going
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
  }, []);

  // ── Auto-start listening when phase changes ──────────────────────
  useEffect(() => {
    if (phase === "listening") {
      setTranscript("");
      interimRef.current = "";
      startListening();
    } else {
      stopListening();
    }
  }, [phase, startListening, stopListening]);

  // ── Submit answer for current question ──────────────────────────
  async function submitAnswer() {
    const answer = interimRef.current.trim() || transcript.trim();
    if (!answer) {
      toast.error("Please say your answer first.");
      return;
    }
    stopListening();
    setPhase("processing");

    const currentQ = questions[currentIndex];
    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);

    // Save answer to DB
    await supabase
      .from("interview_questions")
      .update({ user_answer: answer })
      .eq("id", currentQ.id);

    setTranscript("");
    interimRef.current = "";

    const nextIndex = currentIndex + 1;
    if (nextIndex >= questions.length) {
      // All done — mark interview complete
      await supabase
        .from("interviews")
        .update({ status: "completed" })
        .eq("id", id);
      router.push(`/results/${id}`);
    } else {
      setCurrentIndex(nextIndex);
      setPhase("ready");
    }
  }

  // ── Skip question ────────────────────────────────────────────────
  async function skipQuestion() {
    stopListening();
    const currentQ = questions[currentIndex];
    const newAnswers = [...answers, ""];
    setAnswers(newAnswers);
    await supabase
      .from("interview_questions")
      .update({ user_answer: "" })
      .eq("id", currentQ.id);

    setTranscript("");
    interimRef.current = "";
    const nextIndex = currentIndex + 1;
    if (nextIndex >= questions.length) {
      await supabase.from("interviews").update({ status: "completed" }).eq("id", id);
      router.push(`/results/${id}`);
    } else {
      setCurrentIndex(nextIndex);
      setPhase("ready");
    }
  }

  const currentQuestion = questions[currentIndex];
  const progress = questions.length > 0 ? ((currentIndex) / questions.length) * 100 : 0;

  // ── UI ────────────────────────────────────────────────────────────
  if (phase === "loading" || isGenerating) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-muted-foreground">
          {isGenerating ? "Generating your interview questions…" : "Loading interview…"}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Nav */}
      <nav className="border-b border-border/40 px-6 py-4 flex items-center justify-between max-w-4xl mx-auto w-full">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <span className="font-bold">MockMind</span>
        </Link>
        {interview && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="capitalize">{interview.role}</Badge>
            <Badge variant="secondary" className="capitalize">{interview.difficulty}</Badge>
            <Badge variant="outline">{interview.topic}</Badge>
          </div>
        )}
      </nav>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-10 flex flex-col gap-8">
        {/* Progress */}
        <div>
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Question {Math.min(currentIndex + 1, questions.length)} of {questions.length}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question card */}
        {currentQuestion && (
          <div className="rounded-2xl border border-border/60 bg-card p-8 relative">
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Brain className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground font-medium mb-3 uppercase tracking-wider">
                  Interviewer
                </p>
                <p className="text-lg leading-relaxed font-medium">
                  {currentQuestion.question}
                </p>
              </div>
            </div>

            {/* Speak button */}
            {phase === "ready" && (
              <div className="mt-6 flex justify-end">
                <Button
                  onClick={() => speakQuestion(currentQuestion.question)}
                  className="gap-2"
                >
                  <Volume2 className="h-4 w-4" />
                  Hear question
                </Button>
              </div>
            )}

            {phase === "speaking" && (
              <div className="mt-6 flex items-center gap-3 justify-end text-sm text-muted-foreground">
                <span className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1.5 h-4 bg-primary rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </span>
                Speaking…
              </div>
            )}
          </div>
        )}

        {/* Answer area */}
        {(phase === "listening" || phase === "processing") && (
          <div className="rounded-2xl border border-violet-500/30 bg-violet-950/20 p-8">
            <div className="flex items-start gap-4">
              <div className={cn(
                "shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all",
                phase === "listening" ? "bg-red-500/20 animate-pulse" : "bg-muted"
              )}>
                {phase === "listening" ? (
                  <Mic className="h-5 w-5 text-red-400" />
                ) : (
                  <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground font-medium mb-3 uppercase tracking-wider">
                  {phase === "listening" ? "Your answer (live transcription)" : "Saving answer…"}
                </p>
                {transcript ? (
                  <p className="text-base leading-relaxed">{transcript}</p>
                ) : (
                  <p className="text-muted-foreground italic text-sm">
                    {phase === "listening" ? "Start speaking… your words will appear here." : ""}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={skipQuestion}
            disabled={phase === "processing" || phase === "speaking" || phase === "loading"}
            className="text-muted-foreground"
          >
            Skip question
          </Button>

          <div className="flex gap-3">
            {phase === "ready" && (
              <Button onClick={() => speakQuestion(currentQuestion.question)} variant="outline" className="gap-2">
                <Volume2 className="h-4 w-4" />
                Start answering
              </Button>
            )}

            {phase === "listening" && (
              <>
                <Button variant="outline" onClick={() => { stopListening(); setPhase("ready"); setTranscript(""); interimRef.current = ""; }} className="gap-2 text-muted-foreground">
                  <MicOff className="h-4 w-4" />
                  Cancel
                </Button>
                <Button onClick={submitAnswer} className="gap-2">
                  <StopCircle className="h-4 w-4" />
                  Submit answer
                </Button>
              </>
            )}

            {phase === "processing" && (
              <Button disabled className="gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </Button>
            )}

            {phase === "ready" && transcript && (
              <Button onClick={submitAnswer} className="gap-2">
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Instruction hint */}
        {phase === "ready" && (
          <p className="text-center text-sm text-muted-foreground">
            Click <strong>Hear question</strong> to have the AI read it aloud, then answer verbally.
          </p>
        )}
        {phase === "listening" && (
          <p className="text-center text-sm text-muted-foreground">
            Speak clearly — click <strong>Submit answer</strong> when done.
          </p>
        )}
      </main>
    </div>
  );
}
