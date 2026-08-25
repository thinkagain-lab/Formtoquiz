import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { Quiz } from "@/types/quiz";
import { createGoogleFormFromQuiz } from "@/lib/google-forms";
import {
  TOKEN_COOKIE,
  isGoogleOAuthConfigured,
} from "@/lib/google-oauth-server";

export const runtime = "nodejs";

function isQuiz(value: unknown): value is Quiz {
  if (!value || typeof value !== "object") return false;
  const q = value as Partial<Quiz>;
  return (
    typeof q.title === "string" &&
    Array.isArray(q.questions) &&
    q.questions.length > 0
  );
}

export async function GET() {
  return NextResponse.json({ configured: isGoogleOAuthConfigured() });
}

export async function POST(request: Request) {
  let body: { quiz?: unknown; accessToken?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const fromBody =
    typeof body.accessToken === "string" ? body.accessToken.trim() : "";
  const accessToken = fromBody || cookies().get(TOKEN_COOKIE)?.value || "";
  if (!accessToken) {
    return NextResponse.json(
      { error: "Google is not connected. Click Create Google Form to sign in." },
      { status: 401 },
    );
  }

  if (!isQuiz(body.quiz)) {
    return NextResponse.json(
      { error: "A quiz with a title and at least one question is required." },
      { status: 400 },
    );
  }

  try {
    const form = await createGoogleFormFromQuiz(accessToken, body.quiz);
    return NextResponse.json({ form });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create Google Form.";
    console.error("create-google-form failed:", err);

    const unauthorized =
      /invalid.?authentication|unauthenticated|401|invalid.?credentials/i.test(
        message,
      );
    return NextResponse.json(
      { error: message },
      { status: unauthorized ? 401 : 502 },
    );
  }
}
