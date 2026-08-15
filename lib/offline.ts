import type { Question, Quiz, QuizSettings } from "@/types/quiz";

// A deterministic, dependency-free quiz generator used when no GROQ_API_KEY is
// configured. It keeps the full product flow demonstrable offline. The output
// is intentionally simple but valid against the Quiz schema.

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "of", "to", "in", "on", "for", "with",
  "as", "is", "are", "was", "were", "be", "been", "being", "at", "by", "from",
  "this", "that", "these", "those", "it", "its", "into", "than", "then", "so",
  "such", "can", "will", "would", "should", "could", "has", "have", "had",
  "not", "no", "yes", "if", "we", "you", "they", "he", "she", "them", "their",
]);

function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 25 && s.length <= 240);
}

function keywords(text: string): string[] {
  const counts = new Map<string, number>();
  for (const raw of text.toLowerCase().match(/[a-zA-Z][a-zA-Z-]{3,}/g) ?? []) {
    if (STOPWORDS.has(raw)) continue;
    counts.set(raw, (counts.get(raw) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word);
}

function titleCase(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function pickKeyword(sentence: string, all: string[]): string | null {
  const lower = sentence.toLowerCase();
  return all.find((k) => lower.includes(k)) ?? null;
}

function shuffleDeterministic<T>(arr: T[], seed: number): T[] {
  const out = [...arr];
  let s = seed || 1;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function generateOfflineQuiz(
  content: string,
  settings: QuizSettings,
): Quiz {
  const sentences = splitSentences(content);
  const kw = keywords(content);
  const topKeywords = kw.slice(0, 12);

  const title =
    topKeywords.length > 0
      ? `Quiz: ${topKeywords.slice(0, 3).map(titleCase).join(", ")}`
      : "Generated Quiz";

  const questions: Question[] = [];
  const count = settings.count;

  for (let i = 0; questions.length < count; i++) {
    const sentence = sentences[i % Math.max(sentences.length, 1)];
    const idx = questions.length + 1;
    const typeCycle = idx % 3;

    if (!sentence) {
      questions.push({
        id: idx,
        type: "short_answer",
        question: `In your own words, summarize key point #${idx} from the provided content.`,
        correct_answer: "Answer will vary based on the source content.",
        explanation:
          "This question was generated in offline mode. Add a GROQ_API_KEY for AI-crafted questions.",
      });
      continue;
    }

    const keyword = pickKeyword(sentence, kw);

    if (typeCycle === 1 && keyword) {
      const blanked = sentence.replace(
        new RegExp(`\\b${keyword}\\b`, "i"),
        "_____",
      );
      const distractors = shuffleDeterministic(
        topKeywords.filter((k) => k !== keyword),
        idx,
      ).slice(0, 3);
      const options = shuffleDeterministic(
        [keyword, ...distractors].map(titleCase),
        idx * 7,
      );
      const finalOptions =
        options.length === 4
          ? options
          : [...options, "None of the above"].slice(0, 4);
      questions.push({
        id: idx,
        type: "multiple_choice",
        question: `Fill in the blank: "${blanked}"`,
        options: finalOptions,
        correct_answer: titleCase(keyword),
        explanation: `The source states: "${sentence}"`,
      });
    } else if (typeCycle === 2) {
      questions.push({
        id: idx,
        type: "true_false",
        question: `True or False: ${sentence}`,
        options: ["True", "False"],
        correct_answer: "True",
        explanation: "This statement is taken directly from the source content.",
      });
    } else {
      const focus = keyword ? titleCase(keyword) : `point #${idx}`;
      questions.push({
        id: idx,
        type: "short_answer",
        question: `Based on the content, explain the significance of ${focus}.`,
        correct_answer: sentence,
        explanation: `Reference sentence from the source: "${sentence}"`,
      });
    }
  }

  return { title, questions: questions.slice(0, count) };
}
