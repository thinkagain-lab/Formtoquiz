"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Sparkles, Info } from "lucide-react";
import type { GenerateResponse, Question, Quiz } from "@/types/quiz";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CreateQuizForm } from "@/components/quiz/CreateQuizForm";
import { QuestionCard } from "@/components/quiz/QuestionCard";
import { ExportButtons } from "@/components/quiz/ExportButtons";

// PRE-LAUNCH: this limit is client-side only (localStorage) and easily
// bypassed. Real enforcement must happen server-side in the API routes,
// tied to auth + DB quota. See AGENTS.md "Pre-launch requirements".
const GUEST_LIMIT = 2;
const STORAGE_KEY = "ftq_guest_quizzes_used";
const QUIZ_STORAGE_KEY = "ftq_current_quiz";

type StoredQuiz = {
  quiz: Quiz;
  source: GenerateResponse["source"] | null;
};

export default function AppPage() {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [source, setSource] = useState<GenerateResponse["source"] | null>(null);
  const [used, setUsed] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = Number(localStorage.getItem(STORAGE_KEY) ?? "0");
    if (!Number.isNaN(stored)) setUsed(stored);

    try {
      const raw = sessionStorage.getItem(QUIZ_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as StoredQuiz;
        if (parsed?.quiz?.questions?.length) {
          setQuiz(parsed.quiz);
          setSource(parsed.source ?? null);
        }
      }
    } catch {
      sessionStorage.removeItem(QUIZ_STORAGE_KEY);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!quiz) {
      sessionStorage.removeItem(QUIZ_STORAGE_KEY);
      return;
    }
    const payload: StoredQuiz = { quiz, source };
    sessionStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(payload));
  }, [quiz, source, hydrated]);

  const handleGenerated = (
    generated: Quiz,
    src: GenerateResponse["source"],
  ) => {
    setQuiz(generated);
    setSource(src);
    const next = used + 1;
    setUsed(next);
    localStorage.setItem(STORAGE_KEY, String(next));
  };

  const updateQuestion = (id: number, q: Question) => {
    if (!quiz) return;
    setQuiz({
      ...quiz,
      questions: quiz.questions.map((item) => (item.id === id ? q : item)),
    });
  };

  const deleteQuestion = (id: number) => {
    if (!quiz) return;
    setQuiz({
      ...quiz,
      questions: quiz.questions.filter((item) => item.id !== id),
    });
  };

  const reset = () => {
    setQuiz(null);
    setSource(null);
    sessionStorage.removeItem(QUIZ_STORAGE_KEY);
  };

  const atLimit = used >= GUEST_LIMIT;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="container flex-1 py-10">
        {!quiz ? (
          <div className="mx-auto max-w-3xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Create a quiz
                </h1>
                <p className="text-muted-foreground">
                  Choose a source, set your options, and generate.
                </p>
              </div>
              <Badge variant="secondary">
                {Math.max(GUEST_LIMIT - used, 0)} free left
              </Badge>
            </div>
            <CreateQuizForm onGenerated={handleGenerated} disabled={atLimit} />
          </div>
        ) : (
          <div className="mx-auto max-w-3xl">
            <div className="mb-4 flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={reset} className="gap-2">
                <ArrowLeft className="h-4 w-4" /> New quiz
              </Button>
              <ExportButtons quiz={quiz} />
            </div>

            {source === "offline" && (
              <Card className="mb-4 border-primary/40 bg-accent/40">
                <CardContent className="flex items-start gap-3 p-4 text-sm">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>
                    Generated in <strong>offline mode</strong>. Set a{" "}
                    <code className="rounded bg-muted px-1">GROQ_API_KEY</code>{" "}
                    to get AI-crafted questions. Everything else works the same.
                  </span>
                </CardContent>
              </Card>
            )}

            <div className="mb-6 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Sparkles className="h-5 w-5" />
              </span>
              <Input
                value={quiz.title}
                onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
                className="h-11 text-lg font-semibold"
              />
            </div>

            <p className="mb-3 text-sm text-muted-foreground">
              {quiz.questions.length} questions — edit anything before exporting.
            </p>

            <div className="flex flex-col gap-4">
              {quiz.questions.map((q, i) => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  index={i}
                  onChange={(updated) => updateQuestion(q.id, updated)}
                  onDelete={() => deleteQuestion(q.id)}
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
