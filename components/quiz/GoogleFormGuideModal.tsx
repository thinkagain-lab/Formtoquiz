"use client";

import { useState, type ReactNode } from "react";
import { Check, ClipboardCopy, ExternalLink, FileCode } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const STEPS: { title: string; detail: ReactNode }[] = [
  {
    title: "Open Google Apps Script",
    detail: (
      <>
        Go to{" "}
        <a
          href="https://script.google.com"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-primary underline underline-offset-2"
        >
          script.google.com
        </a>{" "}
        and sign in with the Google account where you want the form.
      </>
    ),
  },
  {
    title: "Create a new project",
    detail: (
      <>
        Click <strong>New project</strong>. Delete the empty{" "}
        <code className="rounded bg-muted px-1">myFunction</code> stub in the
        editor.
      </>
    ),
  },
  {
    title: "Paste the script",
    detail: (
      <>
        The script is already on your clipboard — just paste it. (It&apos;s
        also in the downloaded <code className="rounded bg-muted px-1">.gs</code>{" "}
        file if you need it again.)
      </>
    ),
  },
  {
    title: "Run it",
    detail: (
      <>
        Save, make sure <code className="rounded bg-muted px-1">createQuizForm</code>{" "}
        is selected in the toolbar, and click <strong>Run</strong>.
      </>
    ),
  },
  {
    title: "Authorize (first run only)",
    detail: (
      <>
        Choose <strong>Review permissions</strong> → your account →{" "}
        <strong>Advanced</strong> → <strong>Go to project (unsafe)</strong> →{" "}
        <strong>Allow</strong>. This warning is normal for personal scripts.
      </>
    ),
  },
  {
    title: "Grab your form links",
    detail: (
      <>
        The execution log shows an <strong>Edit URL</strong> (for you) and a{" "}
        <strong>Live URL</strong> (for quiz takers). The form is also in your
        Google Drive.
      </>
    ),
  },
];

interface GoogleFormGuideModalProps {
  open: boolean;
  onClose: () => void;
  fileName: string;
  script: string;
  /** Whether the script was successfully copied to the clipboard on export. */
  autoCopied: boolean;
}

export function GoogleFormGuideModal({
  open,
  onClose,
  fileName,
  script,
  autoCopied,
}: GoogleFormGuideModalProps) {
  const [copied, setCopied] = useState(false);

  const copyScript = async () => {
    try {
      await navigator.clipboard.writeText(script);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard unavailable; user can copy from the downloaded file.
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <div className="mb-4 flex items-start gap-3 pr-8">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <FileCode className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-semibold leading-tight">
            Your Google Form script is ready
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            <code className="rounded bg-muted px-1">{fileName}</code> was
            downloaded{autoCopied ? " and the script was copied to your clipboard" : ""}.
            Follow these steps to turn it into a Google Form (takes ~1 minute).
          </p>
        </div>
      </div>

      <ol className="flex flex-col gap-3">
        {STEPS.map((step, i) => (
          <li key={step.title} className="flex gap-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
              {i + 1}
            </span>
            <div className="text-sm">
              <p className="font-medium">{step.title}</p>
              <p className="mt-0.5 text-muted-foreground">{step.detail}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
        <Button variant="outline" size="sm" onClick={copyScript} className="gap-2">
          {copied ? (
            <>
              <Check className="h-4 w-4" /> Copied!
            </>
          ) : (
            <>
              <ClipboardCopy className="h-4 w-4" /> Copy script again
            </>
          )}
        </Button>
        <a
          href="https://script.google.com/home/projects/create"
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Open Apps Script <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </Dialog>
  );
}
