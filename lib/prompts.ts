import type { QuizSettings } from "@/types/quiz";

export const SYSTEM_PROMPT = `You are an expert educational quiz generator.
Your job is to create high-quality, accurate, and clear quiz questions from the given content.

Rules:
- Generate exactly the number of questions requested.
- Mix question types (multiple_choice, true_false, short_answer) when it makes sense.
- For multiple_choice: provide exactly 4 options and make correct_answer match one option verbatim.
- For true_false: options must be ["True", "False"] and correct_answer must be "True" or "False".
- Always provide a short, helpful explanation.
- Return ONLY valid JSON. No markdown, no extra commentary.

Return format:
{
  "title": "Clear and relevant quiz title",
  "questions": [
    {
      "id": 1,
      "type": "multiple_choice",
      "question": "...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option B",
      "explanation": "..."
    }
  ]
}`;

export function buildUserPrompt(content: string, settings: QuizSettings): string {
  const languageLabel: Record<QuizSettings["language"], string> = {
    english: "English",
    hindi: "Hindi",
    hinglish: "Hinglish (a natural mix of Hindi and English)",
  };

  return [
    `Generate exactly ${settings.count} questions.`,
    `Difficulty: ${settings.difficulty}.`,
    `Language: ${languageLabel[settings.language]}.`,
    "",
    "Content:",
    '"""',
    content,
    '"""',
  ].join("\n");
}
