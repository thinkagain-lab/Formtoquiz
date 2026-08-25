import { NextResponse } from "next/server";
import {
  GOOGLE_FORMS_SCOPES,
  applyOAuthStartCookies,
  createOAuthState,
  createPkcePair,
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

  const { verifier, challenge } = createPkcePair();
  const state = createOAuthState();
  const redirectUri = getGoogleRedirectUri(request);

  const params = new URLSearchParams({
    client_id: getGoogleClientId(),
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GOOGLE_FORMS_SCOPES,
    state,
    include_granted_scopes: "true",
    prompt: "select_account consent",
    code_challenge: challenge,
    code_challenge_method: "S256",
  });

  const res = NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
  );
  applyOAuthStartCookies(res, state, verifier);
  return res;
}
