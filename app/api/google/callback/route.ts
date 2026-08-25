import { NextResponse } from "next/server";
import {
  STATE_COOKIE,
  VERIFIER_COOKIE,
  applyAccessTokenCookie,
  clearOAuthStartCookies,
  exchangeGoogleCode,
  getGoogleRedirectUri,
  getRequestOrigin,
} from "@/lib/google-oauth-server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const origin = getRequestOrigin(request);
  const url = new URL(request.url);
  const error = url.searchParams.get("error");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const cookieHeader = request.headers.get("cookie") ?? "";
  const storedState = readCookie(cookieHeader, STATE_COOKIE);
  const verifier = readCookie(cookieHeader, VERIFIER_COOKIE);

  if (error) {
    const reason = error === "access_denied" ? "access_denied" : "oauth_error";
    const res = NextResponse.redirect(`${origin}/app?google=error&reason=${reason}`);
    clearOAuthStartCookies(res);
    return res;
  }

  if (!code || !state || !storedState || state !== storedState || !verifier) {
    const res = NextResponse.redirect(
      `${origin}/app?google=error&reason=invalid_state`,
    );
    clearOAuthStartCookies(res);
    return res;
  }

  try {
    const tokens = await exchangeGoogleCode({
      code,
      redirectUri: getGoogleRedirectUri(request),
      verifier,
    });
    const res = NextResponse.redirect(`${origin}/app?google=connected`);
    clearOAuthStartCookies(res);
    applyAccessTokenCookie(res, tokens.access_token, tokens.expires_in);
    return res;
  } catch (err) {
    console.error("Google OAuth callback failed:", err);
    const message = err instanceof Error ? err.message : "";
    const reason = /network timeout|reach Google/i.test(message)
      ? "network"
      : "token_exchange";
    const res = NextResponse.redirect(
      `${origin}/app?google=error&reason=${reason}`,
    );
    clearOAuthStartCookies(res);
    return res;
  }
}

function readCookie(header: string, name: string): string {
  const parts = header.split(";").map((p) => p.trim());
  const match = parts.find((p) => p.startsWith(`${name}=`));
  if (!match) return "";
  return decodeURIComponent(match.slice(name.length + 1));
}
