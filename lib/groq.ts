import Groq from "groq-sdk";
import type { Quiz, QuizSettings } from "@/types/quiz";
import { SYSTEM_PROMPT, buildUserPrompt } from "@/lib/prompts";

export function hasGroqKey(): boolean {
  return Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim());
}

const DEFAULT_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

export async function generateQuizWithGroq(
  content: string,
  settings: QuizSettings,
): Promise<Quiz> {
  const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const completion = await client.chat.completions.create({
    model: DEFAULT_MODEL,
    temperature: 0.7,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(content, settings) },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw) as Partial<Quiz>;

  if (!parsed.questions || !Array.isArray(parsed.questions)) {
    throw new Error("Groq returned an unexpected shape (no questions array).");
  }

  return {
    title: parsed.title || "Generated Quiz",
    questions: parsed.questions.map((q, i) => ({
      id: q.id ?? i + 1,
      type: q.type ?? "multiple_choice",
      question: q.question ?? "",
      options: q.options,
      correct_answer: q.correct_answer ?? "",
      explanation: q.explanation ?? "",
    })),
  };
}
