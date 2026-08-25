import { createHash, randomBytes } from "crypto";
import dns from "dns";
import type { NextResponse } from "next/server";

// Windows / ISP setups often advertise broken IPv6 routes; prefer IPv4 for
// Google OAuth token exchange to avoid ConnectTimeoutError.
try {
  dns.setDefaultResultOrder("ipv4first");
} catch {
  // Older Node versions may not support this.
}

export const GOOGLE_FORMS_SCOPES = [
  "https://www.googleapis.com/auth/forms.body",
  "https://www.googleapis.com/auth/drive.file",
].join(" ");

export const STATE_COOKIE = "ftq_g_state";
export const VERIFIER_COOKIE = "ftq_g_verifier";
export const TOKEN_COOKIE = "ftq_g_token";

function cookieBase() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
}

export function getGoogleClientId(): string {
  return (
    process.env.GOOGLE_CLIENT_ID?.trim() ||
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ||
    ""
  );
}

export function getGoogleClientSecret(): string {
  return process.env.GOOGLE_CLIENT_SECRET?.trim() || "";
}

export function isGoogleOAuthConfigured(): boolean {
  return Boolean(getGoogleClientId() && getGoogleClientSecret());
}

export function getRequestOrigin(request: Request): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;

  const url = new URL(request.url);
  const proto =
    request.headers.get("x-forwarded-proto") ??
    url.protocol.replace(":", "") ??
    "http";
  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    url.host;
  return `${proto}://${host}`;
}

export function getGoogleRedirectUri(request: Request): string {
  return `${getRequestOrigin(request)}/api/google/callback`;
}

function base64Url(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function createPkcePair(): { verifier: string; challenge: string } {
  const verifier = base64Url(randomBytes(32));
  const challenge = base64Url(createHash("sha256").update(verifier).digest());
  return { verifier, challenge };
}

export function createOAuthState(): string {
  return base64Url(randomBytes(24));
}

export function applyOAuthStartCookies(
  res: NextResponse,
  state: string,
  verifier: string,
): void {
  res.cookies.set(STATE_COOKIE, state, { ...cookieBase(), maxAge: 600 });
  res.cookies.set(VERIFIER_COOKIE, verifier, { ...cookieBase(), maxAge: 600 });
}

export function applyAccessTokenCookie(
  res: NextResponse,
  token: string,
  expiresIn: number,
): void {
  res.cookies.set(TOKEN_COOKIE, token, {
    ...cookieBase(),
    maxAge: Math.max(60, Math.min(expiresIn, 3600)),
  });
}

export function clearOAuthStartCookies(res: NextResponse): void {
  res.cookies.delete(STATE_COOKIE);
  res.cookies.delete(VERIFIER_COOKIE);
}

export async function exchangeGoogleCode(opts: {
  code: string;
  redirectUri: string;
  verifier: string;
}): Promise<{ access_token: string; expires_in: number }> {
  const clientId = getGoogleClientId();
  const clientSecret = getGoogleClientSecret();
  if (!clientId || !clientSecret) {
    throw new Error(
      "Google OAuth is not configured. Set NEXT_PUBLIC_GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
    );
  }

  const body = new URLSearchParams({
    code: opts.code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: opts.redirectUri,
    grant_type: "authorization_code",
    code_verifier: opts.verifier,
  });

  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 30000);
      const res = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
        signal: controller.signal,
      }).finally(() => clearTimeout(timer));

      const data = (await res.json()) as {
        access_token?: string;
        expires_in?: number;
        error?: string;
        error_description?: string;
      };

      if (!res.ok || !data.access_token) {
        throw new Error(
          data.error_description ||
            data.error ||
            "Failed to exchange Google auth code.",
        );
      }

      return {
        access_token: data.access_token,
        expires_in: data.expires_in ?? 3600,
      };
    } catch (err) {
      lastError = err;
      const message = err instanceof Error ? err.message : String(err);
      const retriable =
        /fetch failed|timeout|abort|ECONNRESET|ENOTFOUND|UND_ERR/i.test(
          message,
        ) ||
        (err instanceof Error &&
          /ConnectTimeoutError|AbortError/i.test(String(err.cause ?? err)));
      console.warn(
        `Google token exchange attempt ${attempt}/3 failed:`,
        message,
      );
      if (!retriable || attempt === 3) break;
      await new Promise((r) => setTimeout(r, attempt * 800));
    }
  }

  const message =
    lastError instanceof Error ? lastError.message : String(lastError);
  if (/fetch failed|timeout|abort|ConnectTimeout/i.test(message)) {
    throw new Error(
      "Could not reach Google’s token server from this machine (network timeout). Check VPN/firewall, try again, or temporarily disable IPv6.",
    );
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("Failed to exchange Google auth code.");
}
