import { NextResponse } from "next/server";
import type { GenerateResponse, QuizSettings } from "@/types/quiz";
import { generateQuizWithGroq, hasGroqKey } from "@/lib/groq";
import { generateOfflineQuiz } from "@/lib/offline";

export const runtime = "nodejs";

const MAX_CONTENT = 15000;

function normalizeSettings(input: unknown): QuizSettings {
  const s = (input ?? {}) as Partial<QuizSettings>;
  const count = [5, 10, 15].includes(Number(s.count))
    ? (Number(s.count) as QuizSettings["count"])
    : 10;
  const difficulty = ["easy", "medium", "hard", "mixed"].includes(
    String(s.difficulty),
  )
    ? (s.difficulty as QuizSettings["difficulty"])
    : "mixed";
  const language = ["english", "hindi", "hinglish"].includes(
    String(s.language),
  )
    ? (s.language as QuizSettings["language"])
    : "english";
  return { count, difficulty, language };
}

export async function POST(request: Request) {
  let body: { content?: string; settings?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const content = (body.content ?? "").toString().trim();
  if (content.length < 30) {
    return NextResponse.json(
      { error: "Please provide at least 30 characters of content." },
      { status: 400 },
    );
  }

  const settings = normalizeSettings(body.settings);
  const trimmed = content.slice(0, MAX_CONTENT);

  try {
    if (hasGroqKey()) {
      const quiz = await generateQuizWithGroq(trimmed, settings);
      const payload: GenerateResponse = { quiz, source: "groq" };
      return NextResponse.json(payload);
    }
  } catch (err) {
    // If Groq fails at runtime, fall back to offline generation so the flow
    // never dead-ends for the user.
    console.error("Groq generation failed, falling back to offline:", err);
  }

  const quiz = generateOfflineQuiz(trimmed, settings);
  const payload: GenerateResponse = { quiz, source: "offline" };
  return NextResponse.json(payload);
}
