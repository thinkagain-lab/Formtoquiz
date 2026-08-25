"use client";

import { Check, ClipboardCopy, ExternalLink, FileSpreadsheet } from "lucide-react";
import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { CreatedGoogleForm } from "@/lib/google-forms";

interface GoogleFormSuccessModalProps {
  open: boolean;
  onClose: () => void;
  form: CreatedGoogleForm | null;
}

export function GoogleFormSuccessModal({
  open,
  onClose,
  form,
}: GoogleFormSuccessModalProps) {
  const [copied, setCopied] = useState<"edit" | "live" | null>(null);

  if (!form) return null;

  const copy = async (kind: "edit" | "live", url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(kind);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Clipboard may be unavailable.
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <div className="mb-4 flex items-start gap-3 pr-8">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <FileSpreadsheet className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-semibold leading-tight">
            Google Form created
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{form.title}</span>{" "}
            is in your Google Drive as a scored quiz with answer keys.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="rounded-lg border bg-muted/40 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Edit form (you)
          </p>
          <p className="mt-1 break-all text-sm">{form.editUrl}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => copy("edit", form.editUrl)}
            >
              {copied === "edit" ? (
                <>
                  <Check className="h-4 w-4" /> Copied
                </>
              ) : (
                <>
                  <ClipboardCopy className="h-4 w-4" /> Copy
                </>
              )}
            </Button>
            <a
              href={form.editUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              Open editor <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div className="rounded-lg border bg-muted/40 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Live quiz (share with students)
          </p>
          <p className="mt-1 break-all text-sm">{form.responderUrl}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => copy("live", form.responderUrl)}
            >
              {copied === "live" ? (
                <>
                  <Check className="h-4 w-4" /> Copied
                </>
              ) : (
                <>
                  <ClipboardCopy className="h-4 w-4" /> Copy
                </>
              )}
            </Button>
            <a
              href={form.responderUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium transition-colors hover:bg-accent"
            >
              Open live form <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button variant="secondary" size="sm" onClick={onClose}>
          Done
        </Button>
      </div>
    </Dialog>
  );
}
