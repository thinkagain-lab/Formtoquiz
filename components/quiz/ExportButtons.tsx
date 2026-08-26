"use client";

import { useEffect, useRef, useState } from "react";
import {
  Download,
  FileText,
  Table,
  FileCode,
  HelpCircle,
  Loader2,
  FileSpreadsheet,
} from "lucide-react";
import type { Quiz } from "@/types/quiz";
import { Button } from "@/components/ui/button";
import {
  downloadBlob,
  downloadTextFile,
  quizToAppsScript,
  quizToCsv,
  quizToPdfBlob,
} from "@/lib/export";
import type { CreatedGoogleForm } from "@/lib/google-forms";
import {
  isGoogleFormsConfigured,
  startGoogleFormOAuth,
} from "@/lib/google-oauth";
import { GoogleFormGuideModal } from "@/components/quiz/GoogleFormGuideModal";
import { GoogleFormSuccessModal } from "@/components/quiz/GoogleFormSuccessModal";

function slug(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 40) || "quiz"
  );
}

const GOOGLE_ERROR_MESSAGES: Record<string, string> = {
  access_denied:
    "Google blocked access. Sign in with the Gmail you added as a Test user (Auth Platform → Audience).",
  not_configured:
    "Google OAuth is missing GOOGLE_CLIENT_SECRET in Vercel env. Add it, redeploy, then try again.",
  invalid_state:
    "Google sign-in session was invalid. Click Create Google Form again (do not use an old browser tab).",
  bad_secret:
    "GOOGLE_CLIENT_SECRET on Vercel does not match the secret in Google Cloud Console. Update it (no quotes), redeploy, then try again.",
  expired:
    "Google sign-in took too long and expired. Click Create Google Form again.",
  token_exchange:
    "Could not finish Google sign-in. Confirm redirect URI https://formtoquiz.vercel.app/api/google/callback and that GOOGLE_CLIENT_SECRET matches Cloud Console.",
  network:
    "Your PC timed out reaching Google’s servers. Disable VPN if on, then click Create Google Form again.",
  oauth_error: "Google sign-in failed. Try again.",
};

export function ExportButtons({ quiz }: { quiz: Quiz }) {
  const [guideOpen, setGuideOpen] = useState(false);
  const [autoCopied, setAutoCopied] = useState(false);
  const [exported, setExported] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createdForm, setCreatedForm] = useState<CreatedGoogleForm | null>(
    null,
  );
  const [successOpen, setSuccessOpen] = useState(false);
  const creatingFromReturn = useRef(false);

  const name = slug(quiz.title);
  const gsFileName = `${name}-google-form.gs`;
  const oneClickEnabled = isGoogleFormsConfigured();

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

  const postCreateForm = async () => {
    const res = await fetch("/api/create-google-form", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ quiz }),
    });
    const data = (await res.json()) as {
      form?: CreatedGoogleForm;
      error?: string;
    };
    if (!res.ok || !data.form) {
      throw new Error(data.error || "Failed to create Google Form.");
    }
    setCreatedForm(data.form);
    setSuccessOpen(true);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("google");
    const reason = params.get("reason") ?? "";

    if (!status) return;

    window.history.replaceState({}, "", "/app");

    if (status === "error") {
      setCreateError(
        GOOGLE_ERROR_MESSAGES[reason] ?? GOOGLE_ERROR_MESSAGES.oauth_error,
      );
      return;
    }

    if (status !== "connected" || creatingFromReturn.current) return;
    if (sessionStorage.getItem("ftq_google_create_lock") === "1") {
      return;
    }
    sessionStorage.setItem("ftq_google_create_lock", "1");
    creatingFromReturn.current = true;
    setCreating(true);
    setCreateError(null);
    void postCreateForm()
      .catch((err: unknown) => {
        setCreateError(
          err instanceof Error ? err.message : "Failed to create Google Form.",
        );
      })
      .finally(() => setCreating(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on return from Google
  }, []);

  const createGoogleForm = async () => {
    if (!oneClickEnabled) {
      await exportAppsScript();
      return;
    }
    sessionStorage.removeItem("ftq_google_create_lock");
    startGoogleFormOAuth();
  };

  const retryCreateWithExistingToken = async () => {
    sessionStorage.removeItem("ftq_google_create_lock");
    setCreating(true);
    setCreateError(null);
    try {
      await postCreateForm();
    } catch (err) {
      setCreateError(
        err instanceof Error ? err.message : "Failed to create Google Form.",
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          onClick={createGoogleForm}
          disabled={creating}
          className="gap-2"
        >
          {creating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Creating…
            </>
          ) : (
            <>
              <FileSpreadsheet className="h-4 w-4" /> Create Google Form
            </>
          )}
        </Button>
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
          title="Download an Apps Script as a manual fallback"
        >
          <FileCode className="h-4 w-4" /> Apps Script
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
      </div>

      {!oneClickEnabled && (
        <p className="text-xs text-muted-foreground">
          One-click Google Form needs{" "}
          <code className="rounded bg-muted px-1">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code>
          . Until then, use Apps Script.
        </p>
      )}

      {createError && (
        <p className="text-sm text-destructive" role="alert">
          {createError}{" "}
          <button
            type="button"
            className="underline underline-offset-2"
            onClick={retryCreateWithExistingToken}
          >
            Retry
          </button>{" "}
          <button
            type="button"
            className="underline underline-offset-2"
            onClick={exportAppsScript}
          >
            Use Apps Script instead
          </button>
        </p>
      )}

      <GoogleFormGuideModal
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        fileName={gsFileName}
        script={quizToAppsScript(quiz)}
        autoCopied={autoCopied}
      />
      <GoogleFormSuccessModal
        open={successOpen}
        onClose={() => setSuccessOpen(false)}
        form={createdForm}
      />
    </div>
  );
}

export { Download };
