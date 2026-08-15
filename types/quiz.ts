export type QuestionType = "multiple_choice" | "true_false" | "short_answer";

export type Difficulty = "easy" | "medium" | "hard" | "mixed";

export type Language = "english" | "hindi" | "hinglish";

export type Question = {
  id: number;
  type: QuestionType;
  question: string;
  options?: string[];
  correct_answer: string;
  explanation: string;
};

export type Quiz = {
  title: string;
  questions: Question[];
};

export type QuizSettings = {
  count: 5 | 10 | 15;
  difficulty: Difficulty;
  language: Language;
};

export type GenerateRequest = {
  content: string;
  settings: QuizSettings;
};

export type GenerateResponse = {
  quiz: Quiz;
  source: "groq" | "offline";
};
