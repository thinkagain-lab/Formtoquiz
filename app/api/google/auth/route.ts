import { NextResponse } from "next/server";
import {
  GOOGLE_FORMS_SCOPES,
  createSignedOAuthState,
  getGoogleClientId,
  getGoogleRedirectUri,
  getRequestOrigin,
  isGoogleOAuthConfigured,
} from "@/lib/google-oauth-server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const origin = getRequestOrigin(request);

  if (!isGoogleOAuthConfigured()) {
    return NextResponse.redirect(
      `${origin}/app?google=error&reason=not_configured`,
    );
  }

  const state = createSignedOAuthState();
  const redirectUri = getGoogleRedirectUri(request);

  const params = new URLSearchParams({
    client_id: getGoogleClientId(),
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GOOGLE_FORMS_SCOPES,
    state,
    include_granted_scopes: "true",
    access_type: "online",
    prompt: "select_account consent",
  });

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
  );
}
