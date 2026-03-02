import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    "X-Title": "MockMind",
  },
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { interviewId } = await req.json();

  // Fetch all questions + answers for this interview
  const { data: questions, error: qErr } = await supabase
    .from("interview_questions")
    .select("*")
    .eq("interview_id", interviewId)
    .order("question_order");

  if (qErr || !questions) {
    return NextResponse.json({ error: "Questions not found" }, { status: 404 });
  }

  const results = [];
  let totalScore = 0;
  let scoredCount = 0;

  for (const q of questions) {
    if (!q.user_answer || q.user_answer.trim().length < 3) {
      const feedback = JSON.stringify({
        score: 0,
        strengths: "No answer provided.",
        improvements: "Make sure to attempt every question.",
        ideal_answer: "A complete answer would have addressed the question directly.",
      });
      await supabase
        .from("interview_questions")
        .update({ ai_feedback: feedback, score: 0 })
        .eq("id", q.id);
      results.push({ ...q, ai_feedback: feedback, score: 0 });
      scoredCount++;
      continue;
    }

    const prompt = `You are a senior technical interviewer evaluating a candidate's verbal answer.

Question: ${q.question}

Candidate's answer: ${q.user_answer}

Evaluate strictly and fairly. Respond in this EXACT JSON format (no markdown, no extra text):
{
  "score": <integer 1-10>,
  "strengths": "<what was good, 1-2 sentences>",
  "improvements": "<what could be improved, 1-2 sentences>",
  "ideal_answer": "<concise model answer, 2-4 sentences>"
}`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
      });

      const content = response.choices[0].message.content ?? "{}";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content);
      const score = Math.min(10, Math.max(0, parseInt(parsed.score) || 0));

      await supabase
        .from("interview_questions")
        .update({ ai_feedback: JSON.stringify(parsed), score })
        .eq("id", q.id);

      results.push({ ...q, ai_feedback: JSON.stringify(parsed), score });
      totalScore += score;
      scoredCount++;
    } catch {
      results.push({ ...q, ai_feedback: "{}", score: 0 });
      scoredCount++;
    }
  }

  const overallScore = scoredCount > 0 ? Math.round((totalScore / scoredCount) * 10) / 10 : 0;

  await supabase
    .from("interviews")
    .update({ overall_score: overallScore, status: "completed" })
    .eq("id", interviewId);

  return NextResponse.json({ results, overallScore });
}
