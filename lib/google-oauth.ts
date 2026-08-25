export const PENDING_QUIZ_KEY = "ftq_current_quiz";

export function getGoogleClientId(): string | null {
  const id = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();
  return id || null;
}

export function isGoogleFormsConfigured(): boolean {
  return Boolean(getGoogleClientId());
}

export function startGoogleFormOAuth(): void {
  window.location.href = "/api/google/auth";
}
