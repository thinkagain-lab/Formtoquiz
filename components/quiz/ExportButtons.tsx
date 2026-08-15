"use client";

import { useState } from "react";
import { Download, FileText, Table, FileCode } from "lucide-react";
import type { Quiz } from "@/types/quiz";
import { Button } from "@/components/ui/button";
import {
  downloadBlob,
  downloadTextFile,
  quizToAppsScript,
  quizToCsv,
  quizToPdfBlob,
} from "@/lib/export";

function slug(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 40) || "quiz"
  );
}

export function ExportButtons({ quiz }: { quiz: Quiz }) {
  const [copied, setCopied] = useState(false);
  const name = slug(quiz.title);

  const exportCsv = () =>
    downloadTextFile(`${name}.csv`, quizToCsv(quiz), "text/csv");

  const exportPdf = () => downloadBlob(`${name}.pdf`, quizToPdfBlob(quiz));

  const exportAppsScript = async () => {
    const script = quizToAppsScript(quiz);
    downloadTextFile(`${name}-google-form.gs`, script, "text/plain");
    try {
      await navigator.clipboard.writeText(script);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard may be unavailable; the file download still succeeds.
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" onClick={exportCsv} className="gap-2">
        <Table className="h-4 w-4" /> CSV
      </Button>
      <Button variant="outline" size="sm" onClick={exportPdf} className="gap-2">
        <FileText className="h-4 w-4" /> PDF
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={exportAppsScript}
        className="gap-2"
      >
        <FileCode className="h-4 w-4" />
        {copied ? "Copied script!" : "Google Form"}
      </Button>
    </div>
  );
}

export { Download };
