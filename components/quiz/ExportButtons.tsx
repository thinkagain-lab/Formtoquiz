"use client";

import { useState } from "react";
import { Download, FileText, Table, FileCode, HelpCircle } from "lucide-react";
import type { Quiz } from "@/types/quiz";
import { Button } from "@/components/ui/button";
import {
  downloadBlob,
  downloadTextFile,
  quizToAppsScript,
  quizToCsv,
  quizToPdfBlob,
} from "@/lib/export";
import { GoogleFormGuideModal } from "@/components/quiz/GoogleFormGuideModal";

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
  const [guideOpen, setGuideOpen] = useState(false);
  const [autoCopied, setAutoCopied] = useState(false);
  const [exported, setExported] = useState(false);
  const name = slug(quiz.title);
  const gsFileName = `${name}-google-form.gs`;

  const exportCsv = () =>
    downloadTextFile(`${name}.csv`, quizToCsv(quiz), "text/csv");

  const exportPdf = () => downloadBlob(`${name}.pdf`, quizToPdfBlob(quiz));

  const exportAppsScript = async () => {
    const script = quizToAppsScript(quiz);
    downloadTextFile(gsFileName, script, "text/plain");
    let copied = false;
    try {
      await navigator.clipboard.writeText(script);
      copied = true;
    } catch {
      // Clipboard may be unavailable; the file download still succeeds.
    }
    setAutoCopied(copied);
    setExported(true);
    setGuideOpen(true);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
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
        <FileCode className="h-4 w-4" /> Google Form
      </Button>
      {exported && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setGuideOpen(true)}
          className="gap-2 text-muted-foreground"
          aria-label="How to use the downloaded script"
        >
          <HelpCircle className="h-4 w-4" /> How to use
        </Button>
      )}
      <GoogleFormGuideModal
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        fileName={gsFileName}
        script={quizToAppsScript(quiz)}
        autoCopied={autoCopied}
      />
    </div>
  );
}

export { Download };
