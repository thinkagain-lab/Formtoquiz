import { NextResponse } from "next/server";
import {
  getGoogleClientId,
  getGoogleClientSecret,
  getGoogleRedirectUri,
  isGoogleOAuthConfigured,
} from "@/lib/google-oauth-server";

export const runtime = "nodejs";

/** Safe config check for Vercel debugging (never returns secret values). */
export async function GET(request: Request) {
  const secret = getGoogleClientSecret();
  return NextResponse.json({
    configured: isGoogleOAuthConfigured(),
    hasClientId: Boolean(getGoogleClientId()),
    hasClientSecret: Boolean(secret),
    clientSecretLength: secret.length,
    appUrl: process.env.NEXT_PUBLIC_APP_URL?.trim() || null,
    cloudProject: process.env.GOOGLE_CLOUD_PROJECT?.trim() || null,
    redirectUri: getGoogleRedirectUri(request),
    scopes: [
      "https://www.googleapis.com/auth/forms.body",
      "https://www.googleapis.com/auth/drive",
    ],
  });
}
