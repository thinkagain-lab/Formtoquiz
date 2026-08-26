import { NextResponse } from "next/server";
import {
  applyAccessTokenCookie,
  exchangeGoogleCode,
  getGoogleRedirectUri,
  getRequestOrigin,
  parseSignedOAuthState,
} from "@/lib/google-oauth-server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const origin = getRequestOrigin(request);
  const url = new URL(request.url);
  const error = url.searchParams.get("error");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (error) {
    const reason = error === "access_denied" ? "access_denied" : "oauth_error";
    return NextResponse.redirect(`${origin}/app?google=error&reason=${reason}`);
  }

  const parsed = parseSignedOAuthState(state);
  if (!parsed.ok) {
    console.error("OAuth state parse failed:", {
      reason: parsed.reason,
      hasCode: Boolean(code),
      stateLength: state?.length ?? 0,
      secretConfigured: Boolean(process.env.GOOGLE_CLIENT_SECRET?.trim()),
    });
    const reason =
      parsed.reason === "bad_signature"
        ? "bad_secret"
        : parsed.reason === "expired"
          ? "expired"
          : "invalid_state";
    return NextResponse.redirect(`${origin}/app?google=error&reason=${reason}`);
  }

  if (!code) {
    return NextResponse.redirect(
      `${origin}/app?google=error&reason=invalid_state`,
    );
  }

  try {
    const tokens = await exchangeGoogleCode({
      code,
      redirectUri: getGoogleRedirectUri(request),
    });
    const res = NextResponse.redirect(`${origin}/app?google=connected`);
    applyAccessTokenCookie(res, tokens.access_token, tokens.expires_in, request);
    return res;
  } catch (err) {
    console.error("Google OAuth callback failed:", err);
    const message = err instanceof Error ? err.message : "";
    const reason = /network timeout|reach Google/i.test(message)
      ? "network"
      : "token_exchange";
    return NextResponse.redirect(`${origin}/app?google=error&reason=${reason}`);
  }
}
