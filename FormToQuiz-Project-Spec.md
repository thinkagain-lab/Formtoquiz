# FormToQuiz — Complete Project Specification

**Version:** 1.0  
**Target:** Buildable in 1 day with Cursor + Groq API  
**Goal:** Simple, monetizable micro-SaaS that turns any content into a ready-to-use Google Form quiz.

---

## 1. Product Overview

**Name:** FormToQuiz  
**One-liner:** Turn any PDF, text, or YouTube video into a complete Google Form quiz in seconds using AI.

**Core Value:**
- Teachers, trainers, course creators, and HR teams hate creating quizzes manually.
- Users paste content → AI generates high-quality multiple-choice + short-answer questions → one-click export to Google Forms.

**Target Users:**
- Teachers & Tutors
- Online course creators
- Corporate trainers / L&D teams
- Students making practice tests
- HR teams creating assessment quizzes

---

## 2. Core Features (MVP – Day 1)

### 2.1 Input Methods
1. **Paste Text** – Direct text input (up to 15,000 characters)
2. **Upload PDF** – Extract text from PDF (first 10–15 pages)
3. **YouTube URL** – Extract transcript + generate questions from it

### 2.2 AI Generation (Powered by Groq)
- Generate **8–15 questions** by default
- Question types:
  - Multiple Choice (4 options)
  - True / False
  - Short Answer
- User can choose:
  - Difficulty: Easy / Medium / Hard / Mixed
  - Number of questions: 5 / 10 / 15
  - Language: English / Hindi / Hinglish
- Include **correct answers + short explanations**

### 2.3 Output & Export
- Beautiful preview of generated quiz
- One-click **Create Google Form** (using Google Forms API or Apps Script)
- Download as:
  - Google Form link
  - PDF (questions only)
  - CSV (for import into other tools)
- Ability to edit questions before exporting

### 2.4 User System (Freemium)
- Guest mode: 2 free quizzes (no account)
- Free account: 5 quizzes / month
- Pro plan: Unlimited quizzes + priority generation + advanced options

### 2.5 Additional Nice-to-Have (if time permits)
- Save quiz history
- Share public quiz link (read-only)
- Regenerate individual questions
- Custom branding on Google Form (Pro)

---

## 3. Tech Stack

| Layer              | Technology                          | Reason |
|--------------------|-------------------------------------|------|
| Frontend           | Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui | Fast, modern, Cursor-friendly |
| AI                 | Groq API (Llama-3.3-70B-Versatile or Mixtral) | Extremely fast + cheap |
| Auth               | Clerk                               | Fastest auth for Next.js |
| Database           | Supabase (Postgres)                 | Free tier is enough |
| File Upload        | UploadThing or Supabase Storage     | Easy PDF handling |
| PDF Parsing        | pdf-parse or pdfjs-dist             | Client/server side |
| YouTube Transcript | youtube-transcript or similar       | Free |
| Payments           | Razorpay (India) + Stripe           | Local + global |
| Deployment         | Vercel                              | One-click |
| Google Forms       | Google Forms API / Apps Script      | Core export feature |

---

## 4. Database Schema (Supabase)

```sql
-- users table is handled by Clerk

create table quizzes (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,                    -- Clerk user ID
  title text,
  source_type text,                         -- 'text' | 'pdf' | 'youtube'
  source_content text,                      -- original text or URL
  questions jsonb not null,                 -- array of question objects
  settings jsonb,                           -- difficulty, count, language
  google_form_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table usage (
  user_id text primary key,
  free_quizzes_used integer default 0,
  plan text default 'free',                 -- 'free' | 'pro'
  pro_expires_at timestamp with time zone,
  updated_at timestamp with time zone default now()
);
```

---

## 5. API Routes (Next.js)

```
POST /api/generate          → Generate quiz from content using Groq
POST /api/parse-pdf         → Extract text from uploaded PDF
POST /api/youtube-transcript→ Get transcript from YouTube URL
POST /api/create-google-form→ Create Google Form + return link
POST /api/save-quiz         → Save quiz to database
GET  /api/quizzes           → List user’s quizzes
POST /api/checkout          → Create Razorpay/Stripe payment session
```

---

## 6. UI / UX Structure

### Pages
1. **/** – Landing page (hero, how it works, pricing, demo)
2. **/app** – Main dashboard (create new quiz)
3. **/app/quiz/[id]** – Quiz preview + edit + export
4. **/pricing** – Pricing page
5. **/login** & **/signup** – Auth (Clerk)

### Main Flow (Create Quiz)
1. Choose input method (Text / PDF / YouTube)
2. Paste content or upload
3. Select settings (questions count, difficulty, language)
4. Click “Generate Quiz”
5. Loading state with progress
6. Preview questions → Edit if needed
7. “Create Google Form” or “Download”

---

## 7. Pricing (Suggested)

| Plan       | Price          | Limits                      |
|------------|----------------|-----------------------------|
| Free       | ₹0             | 5 quizzes / month           |
| Pro        | ₹299 / month   | Unlimited + Hindi support + priority |
| Lifetime   | ₹1,999         | Unlimited forever           |

(Or $9 / month for international)

---

## 8. Groq Prompt Strategy (Critical)

You will use a strong system prompt + structured output (JSON mode) so the response is always clean and parseable.

**Example System Prompt:**
```
You are an expert quiz generator for educators. 
Generate high-quality educational questions based on the provided content.
Return ONLY valid JSON in this exact format:

{
  "title": "Quiz Title",
  "questions": [
    {
      "id": 1,
      "type": "multiple_choice",
      "question": "...",
      "options": ["A", "B", "C", "D"],
      "correct_answer": "B",
      "explanation": "Short explanation"
    }
  ]
}
```

---

## 9. Success Metrics for MVP
- User can generate a quiz from text in < 15 seconds
- Quiz quality is good enough that teachers don’t feel embarrassed sharing it
- Export to Google Form works reliably
- Clear upgrade path after free limit

---

## 10. Future Ideas (After MVP)
- Bulk quiz generation
- Question bank
- Student-facing quiz taking page (with scoring)
- Integration with Google Classroom
- AI that adjusts difficulty based on past performance
- WhatsApp bot version

---

**End of Specification**
