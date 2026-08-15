# FormToQuiz — Agent Notes

FormToQuiz is a Next.js 14 (App Router) micro-SaaS that turns text, PDFs, or
YouTube videos into quizzes and exports them as CSV, PDF, or a Google Apps
Script (`.gs`) that builds a Google Form. See `FormToQuiz-Project-Spec.md` for
the full product spec.

## Key locations

- Quiz generation API: `app/api/generate/route.ts` (Groq, falls back to offline mode without `GROQ_API_KEY`)
- Main app page + free-quota logic: `app/app/page.tsx`
- Export logic (CSV / PDF / Apps Script): `lib/export.ts`, `components/quiz/ExportButtons.tsx`
- Google Form how-to-use guide modal: `components/quiz/GoogleFormGuideModal.tsx`

## Pre-launch requirements (MUST be done before real users)

### 1. Server-side enforcement of the free quota

The free-attempt limit is currently **client-side only** and trivially
bypassable:

- `GUEST_LIMIT` in `app/app/page.tsx` caps guest usage, but the count is
  stored in browser localStorage (`ftq_guest_quizzes_used`). Clearing
  localStorage or using incognito resets it.
- The API routes (`/api/generate`, `/api/parse-pdf`, `/api/youtube`) do **no**
  quota or auth checks at all — anyone can call them directly and generate
  unlimited quizzes.

Before launch, implement:

- Auth (per the spec: Supabase Auth) so usage is tied to a user account.
- Quota tracking in the database (spec has a `users.quiz_count` /
  plan column) and enforcement **inside the API routes**, returning
  HTTP 402/429 when the free limit is exhausted.
- Keep the client-side counter only as a UX hint, never as the source of
  truth.
- Rate limiting on the API routes (IP-based) to protect the Groq API key
  budget from abuse even for logged-out visitors.

## Known constraints

### YouTube transcripts and cloud IP blocking

Since late 2024 YouTube blocks its transcript/caption endpoints for
datacenter IPs (Vercel, AWS, GCP...). Consequences:

- Direct fetching (`lib/youtube.ts` `fetchTranscriptDirect`) works from
  residential IPs (local dev) but NOT from Vercel or this Cloud Agent VM.
- Production needs `SUPADATA_API_KEY` (hosted transcript API,
  https://supadata.ai, free tier available) — `/api/youtube` uses it
  automatically when set.
- When both methods fail, the API returns an error `code` and the UI shows a
  copy-the-transcript-manually guide (`ytHelp` in
  `components/quiz/CreateQuizForm.tsx`).
- Do NOT add back the `youtube-transcript` npm package; it is broken.

## Development tips

- `GUEST_LIMIT` in `app/app/page.tsx` can be raised while testing, or reset
  the counter in DevTools with
  `localStorage.removeItem("ftq_guest_quizzes_used")`.
- Without `GROQ_API_KEY`, generation runs in deterministic offline mode
  (`lib/offline.ts`), which is fine for UI testing.
