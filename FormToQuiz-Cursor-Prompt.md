# FormToQuiz — Master Cursor Prompt

You are an expert full-stack developer specializing in Next.js, TypeScript, Tailwind, and AI integrations. 

I want you to build a complete production-ready MVP of an application called **FormToQuiz**.

### Product Goal
FormToQuiz allows users to turn any text, PDF, or YouTube video into a high-quality Google Form quiz using AI (Groq API). It is a freemium micro-SaaS targeted at teachers, trainers, and course creators.

### Core Requirements (MVP)

1. **Input Methods**
   - Paste text
   - Upload PDF (extract text)
   - Enter YouTube URL (get transcript)

2. **AI Generation using Groq API**
   - Use Llama-3.3-70B-Versatile or the best available model on Groq
   - Generate 5 / 10 / 15 questions
   - Support difficulty: Easy / Medium / Hard / Mixed
   - Support language: English / Hindi / Hinglish
   - Question types: Multiple Choice (4 options), True/False, Short Answer
   - Always return correct answer + short explanation
   - Output must be clean structured JSON

3. **Output**
   - Beautiful editable quiz preview
   - Ability to edit individual questions
   - One-click “Create Google Form” (use Google Forms API if possible, otherwise generate a clean downloadable format + clear instructions)
   - Download as PDF and CSV

4. **User System**
   - Clerk authentication
   - Guest users: 2 free quizzes
   - Free logged-in users: 5 quizzes per month
   - Pro users: Unlimited

5. **Tech Stack (Strict)**
   - Next.js 14 (App Router) + TypeScript
   - Tailwind CSS + shadcn/ui
   - Clerk for Auth
   - Supabase for database
   - Groq SDK for AI
   - UploadThing or Supabase Storage for PDFs
   - Razorpay for Indian payments (add later if time)
   - Deployable on Vercel

### Project Structure You Should Create

```
formtoquiz/
├── app/
│   ├── (marketing)/
│   │   ├── page.tsx                 # Landing page
│   │   └── pricing/page.tsx
│   ├── (app)/
│   │   ├── layout.tsx
│   │   ├── page.tsx                 # Create Quiz dashboard
│   │   └── quiz/[id]/page.tsx      # Quiz preview & edit
│   ├── api/
│   │   ├── generate/route.ts
│   │   ├── parse-pdf/route.ts
│   │   ├── youtube/route.ts
│   │   ├── create-form/route.ts
│   │   └── save-quiz/route.ts
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                          # shadcn components
│   ├── quiz/
│   │   ├── CreateQuizForm.tsx
│   │   ├── QuizPreview.tsx
│   │   ├── QuestionCard.tsx
│   │   └── ExportButtons.tsx
│   └── ...
├── lib/
│   ├── groq.ts
│   ├── supabase.ts
│   ├── prompts.ts
│   └── utils.ts
├── types/
│   └── quiz.ts
└── ...
```

### Important Implementation Rules

1. Use **Server Actions** or API routes properly. Keep AI calls on the server.
2. Use Groq’s JSON mode or strong structured output prompting so parsing never fails.
3. Make the UI extremely clean and modern (inspired by Vercel, Linear, and MagicSlides).
4. Show good loading states and error handling.
5. Mobile responsive.
6. Add proper TypeScript types for everything (especially the quiz JSON structure).

### Database Schema (Supabase)

```sql
create table quizzes (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  title text,
  source_type text check (source_type in ('text', 'pdf', 'youtube')),
  source_content text,
  questions jsonb not null,
  settings jsonb,
  google_form_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table usage (
  user_id text primary key,
  free_quizzes_used int default 0,
  plan text default 'free',
  pro_expires_at timestamptz,
  updated_at timestamptz default now()
);
```

### Quiz JSON Structure (Strict)

```typescript
type Question = {
  id: number;
  type: "multiple_choice" | "true_false" | "short_answer";
  question: string;
  options?: string[];          // only for multiple_choice
  correct_answer: string;
  explanation: string;
};

type Quiz = {
  title: string;
  questions: Question[];
};
```

### Groq System Prompt (Use this or improve it)

```
You are an expert educational quiz generator. 
Your job is to create high-quality, accurate, and clear quiz questions from the given content.

Rules:
- Generate exactly the number of questions requested
- Mix question types if possible
- For multiple choice: exactly 4 options
- Always provide a short, helpful explanation
- Return ONLY valid JSON. No markdown, no extra text.

Return format:
{
  "title": "Clear and relevant quiz title",
  "questions": [
    {
      "id": 1,
      "type": "multiple_choice",
      "question": "...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option B",
      "explanation": "..."
    }
  ]
}
```

### Step-by-step Order I Want You to Follow

1. Initialize the Next.js project with TypeScript, Tailwind, and shadcn/ui.
2. Set up Clerk authentication.
3. Set up Supabase client and create the tables (give me the SQL).
4. Create the main types.
5. Build the landing page.
6. Build the Create Quiz page (start with Text input only).
7. Implement the `/api/generate` route with Groq.
8. Build the Quiz Preview + Edit UI.
9. Add PDF upload + parsing.
10. Add YouTube transcript support.
11. Add usage tracking (freemium limits).
12. Add export options (at minimum PDF + CSV, ideally Google Form).

Start by creating the project structure and the most important files first.  
Ask me for any API keys or environment variables you need (GROQ_API_KEY, NEXT_PUBLIC_CLERK_*, SUPABASE_*, etc.).

After the basic structure is ready, begin implementing feature by feature and show me the code.

Ready? Let’s build FormToQuiz.
