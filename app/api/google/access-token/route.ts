import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { TOKEN_COOKIE } from "@/lib/google-oauth-server";

export const runtime = "nodejs";

/**
 * Returns the short-lived Google access token so the browser can call
 * Forms API directly (avoids datacenter IP / server-side INTERNAL errors).
 */
export async function GET() {
  const accessToken = cookies().get(TOKEN_COOKIE)?.value;
  if (!accessToken) {
    return NextResponse.json(
      { error: "Google is not connected. Click Create Google Form to sign in." },
      { status: 401 },
    );
  }
  return NextResponse.json({ accessToken });
}
