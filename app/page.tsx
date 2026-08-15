import Link from "next/link";
import {
  FileText,
  Youtube,
  Sparkles,
  Download,
  Pencil,
  Zap,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const inputs = [
  {
    icon: FileText,
    title: "Paste text",
    body: "Drop in lecture notes, an article, or any content up to 15,000 characters.",
  },
  {
    icon: FileText,
    title: "Upload PDF",
    body: "Extract text from a PDF and turn it into questions automatically.",
  },
  {
    icon: Youtube,
    title: "YouTube URL",
    body: "Pull a video transcript and generate a quiz from what was said.",
  },
];

const features = [
  {
    icon: Zap,
    title: "AI-powered in seconds",
    body: "Groq generates 5, 10, or 15 questions across multiple types, with answers and explanations.",
  },
  {
    icon: Pencil,
    title: "Edit before you export",
    body: "Tweak any question, option, answer, or explanation in a clean editor.",
  },
  {
    icon: Download,
    title: "Export anywhere",
    body: "Download CSV or PDF, or generate a Google Apps Script to build a real Google Form quiz.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="container flex flex-col items-center gap-6 py-20 text-center sm:py-28">
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="h-3 w-3" /> Powered by Groq AI
          </Badge>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
            Turn anything into a{" "}
            <span className="text-primary">Google Form quiz</span> in seconds
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Paste text, upload a PDF, or drop a YouTube link. FormToQuiz uses AI
            to generate high-quality quizzes you can edit and export — no more
            writing questions by hand.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/app">
              <Button size="lg" className="gap-2">
                <Sparkles className="h-4 w-4" /> Create your first quiz
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline">
                See pricing
              </Button>
            </Link>
          </div>
          <p className="text-sm text-muted-foreground">
            2 free quizzes as a guest — no account required.
          </p>
        </section>

        <section className="container pb-16">
          <h2 className="mb-8 text-center text-2xl font-semibold">
            Start from any source
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {inputs.map((item) => (
              <Card key={item.title}>
                <CardContent className="flex flex-col gap-3 p-6">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <item.icon className="h-5 w-5" />
                  </span>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="border-t bg-muted/30 py-16">
          <div className="container">
            <h2 className="mb-8 text-center text-2xl font-semibold">
              Everything you need to ship a quiz
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {features.map((item) => (
                <Card key={item.title}>
                  <CardContent className="flex flex-col gap-3 p-6">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <item.icon className="h-5 w-5" />
                    </span>
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="container flex flex-col items-center gap-4 py-20 text-center">
          <h2 className="text-3xl font-bold">Ready to save hours?</h2>
          <p className="max-w-xl text-muted-foreground">
            Generate your first quiz right now. It takes less than a minute.
          </p>
          <Link href="/app">
            <Button size="lg" className="gap-2">
              <Sparkles className="h-4 w-4" /> Get started free
            </Button>
          </Link>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container text-center text-sm text-muted-foreground">
          Built with Next.js, Tailwind, and Groq. FormToQuiz &copy;{" "}
          {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}
