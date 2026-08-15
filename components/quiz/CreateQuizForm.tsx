"use client";

import { useRef, useState } from "react";
import { FileText, Youtube, Type, Loader2, Sparkles, Upload } from "lucide-react";
import type {
  Difficulty,
  GenerateResponse,
  Language,
  Quiz,
  QuizSettings,
} from "@/types/quiz";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Tab = "text" | "pdf" | "youtube";

const tabs: { id: Tab; label: string; icon: typeof Type }[] = [
  { id: "text", label: "Paste text", icon: Type },
  { id: "pdf", label: "Upload PDF", icon: FileText },
  { id: "youtube", label: "YouTube", icon: Youtube },
];

export function CreateQuizForm({
  onGenerated,
  disabled,
}: {
  onGenerated: (quiz: Quiz, source: GenerateResponse["source"]) => void;
  disabled?: boolean;
}) {
  const [tab, setTab] = useState<Tab>("text");
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [count, setCount] = useState<QuizSettings["count"]>(10);
  const [difficulty, setDifficulty] = useState<Difficulty>("mixed");
  const [language, setLanguage] = useState<Language>("english");

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ytHelp, setYtHelp] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePdf = async (file: File) => {
    setError(null);
    setStatus("Extracting text from PDF…");
    setFileName(file.name);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/parse-pdf", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to parse PDF");
      setContent(data.text);
      setStatus(`Extracted ${data.text.length.toLocaleString()} characters.`);
    } catch (e) {
      setStatus(null);
      setError(e instanceof Error ? e.message : "Failed to parse PDF");
    }
  };

  const handleYoutube = async (): Promise<string | null> => {
    setStatus("Fetching transcript…");
    const res = await fetch("/api/youtube", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const data = await res.json();
    if (!res.ok) {
      // Show the copy-paste fallback guide for transcript-availability
      // failures (but not for e.g. a malformed URL).
      if (data.code && data.code !== "BAD_URL") setYtHelp(true);
      throw new Error(data.error || "Failed to fetch transcript");
    }
    setContent(data.text);
    return data.text as string;
  };

  const generate = async () => {
    setError(null);
    setYtHelp(false);
    setLoading(true);
    try {
      let text = content;
      if (tab === "youtube" && !text) {
        text = (await handleYoutube()) ?? "";
      }
      if (text.trim().length < 30) {
        throw new Error("Please provide at least 30 characters of content.");
      }

      setStatus("Generating quiz…");
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: text,
          settings: { count, difficulty, language },
        }),
      });
      const data = (await res.json()) as GenerateResponse & { error?: string };
      if (!res.ok) throw new Error(data.error || "Generation failed");

      setStatus(null);
      onGenerated(data.quiz, data.source);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setStatus(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="flex flex-col gap-5 p-6">
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTab(t.id);
                setError(null);
                setStatus(null);
                setYtHelp(false);
              }}
              className={cn(
                "inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                tab === t.id
                  ? "border-primary bg-accent text-accent-foreground"
                  : "border-input hover:bg-muted",
              )}
            >
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </div>

        {tab === "text" && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              placeholder="Paste your notes, an article, or any content here…"
              className="min-h-[200px]"
              value={content}
              maxLength={15000}
              onChange={(e) => setContent(e.target.value)}
            />
            <span className="text-right text-xs text-muted-foreground">
              {content.length.toLocaleString()} / 15,000
            </span>
          </div>
        )}

        {tab === "pdf" && (
          <div className="flex flex-col gap-2">
            <Label>PDF file</Label>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-sm text-muted-foreground transition-colors hover:bg-muted"
            >
              <Upload className="h-6 w-6" />
              {fileName ? (
                <span className="font-medium text-foreground">{fileName}</span>
              ) : (
                <span>Click to select a PDF</span>
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handlePdf(file);
              }}
            />
            {content && (
              <p className="text-xs text-muted-foreground">
                Preview: {content.slice(0, 160)}…
              </p>
            )}
          </div>
        )}

        {tab === "youtube" && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="yt">YouTube URL</Label>
            <Input
              id="yt"
              placeholder="https://www.youtube.com/watch?v=…"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <span className="text-xs text-muted-foreground">
              We fetch the transcript automatically when you generate.
            </span>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="count">Questions</Label>
            <select
              id="count"
              value={count}
              onChange={(e) =>
                setCount(Number(e.target.value) as QuizSettings["count"])
              }
              className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="difficulty">Difficulty</Label>
            <select
              id="difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="language">Language</Label>
            <select
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="english">English</option>
              <option value="hindi">Hindi</option>
              <option value="hinglish">Hinglish</option>
            </select>
          </div>
        </div>

        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        {ytHelp && (
          <div className="rounded-md border border-primary/40 bg-accent/40 px-4 py-3 text-sm">
            <p className="font-medium">
              Quick workaround: copy the transcript yourself
            </p>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted-foreground">
              <li>Open the video on YouTube.</li>
              <li>
                Below the title, expand the description (tap{" "}
                <strong>…more</strong>) and click{" "}
                <strong>Show transcript</strong>.
              </li>
              <li>Select and copy the transcript text.</li>
              <li>
                Paste it in the <strong>Paste text</strong> tab here and
                generate.
              </li>
            </ol>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 gap-2"
              onClick={() => {
                setTab("text");
                setError(null);
                setYtHelp(false);
              }}
            >
              <Type className="h-4 w-4" /> Go to Paste text
            </Button>
          </div>
        )}
        {status && !error && (
          <p className="text-sm text-muted-foreground">{status}</p>
        )}

        <Button
          size="lg"
          onClick={generate}
          disabled={loading || disabled}
          className="gap-2"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {loading ? "Generating…" : "Generate quiz"}
        </Button>
        {disabled && (
          <p className="text-center text-sm text-muted-foreground">
            You&apos;ve used all your free guest quizzes. Upgrade to keep going.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
