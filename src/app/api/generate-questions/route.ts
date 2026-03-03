import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
    defaultHeaders: {
      "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
      "X-Title": "MockMind",
    },
  });

  const { interviewId, role, difficulty, topic, numQuestions } = await req.json();

  const prompt = `You are a senior technical interviewer at a top tech company. 
Generate exactly ${numQuestions} technical interview questions for a ${difficulty}-level ${role} position focused on "${topic}".

Rules:
- Questions should be real-world, practical, and progressively harder
- Mix conceptual understanding and practical problem-solving
- No coding challenges that require writing full code (this is a verbal interview)
- Each question should be answerable in 2-5 minutes verbally
- Return ONLY a JSON array of question strings, nothing else

Example format: ["Question 1?", "Question 2?", ...]`;

  let response;
  try {
    response = await openai.chat.completions.create({
      model: "openai/gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });
  } catch (err: any) {
    console.error("OpenAI/OpenRouter Error:", err);
    return NextResponse.json(
      { error: "AI service error: " + (err.message || "Unknown error") },
      { status: err.status || 500 }
    );
  }

  let questions: string[] = [];
  try {
    const content = response.choices[0].message.content ?? "[]";
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    questions = JSON.parse(jsonMatch ? jsonMatch[0] : content);
  } catch {
    return NextResponse.json({ error: "Failed to parse questions" }, { status: 500 });
  }

  // Save questions to DB
  const rows = questions.map((q, i) => ({
    interview_id: interviewId,
    question_order: i + 1,
    question: q,
  }));

  const { error } = await supabase.from("interview_questions").insert(rows);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ questions });
}
