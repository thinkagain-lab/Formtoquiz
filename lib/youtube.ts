// YouTube transcript fetching.
//
// The `youtube-transcript` npm package broke when YouTube changed its
// internals, and — bigger problem — since late 2024 YouTube blocks its
// transcript endpoints for all datacenter IPs (Vercel, AWS, ...). Strategy:
//
//   1. If SUPADATA_API_KEY is set, use Supadata's hosted transcript API.
//      This is the only approach that works reliably in production hosting.
//   2. Otherwise scrape the watch page directly. Works from residential IPs
//      (local dev) but is usually blocked from cloud hosting.
//
// Errors carry a `code` so the API route / UI can guide the user.

export type TranscriptErrorCode =
  | "BAD_URL"
  | "NO_CAPTIONS"
  | "BLOCKED"
  | "FETCH_FAILED";

export class TranscriptError extends Error {
  constructor(
    public code: TranscriptErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "TranscriptError";
  }
}

export function extractVideoId(url: string): string | null {
  const trimmed = url.trim();
  // Bare 11-char video id
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed;
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }
  const host = parsed.hostname.replace(/^www\.|^m\./, "");
  if (host === "youtu.be") {
    const id = parsed.pathname.slice(1).split("/")[0];
    return /^[\w-]{11}$/.test(id) ? id : null;
  }
  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const v = parsed.searchParams.get("v");
    if (v && /^[\w-]{11}$/.test(v)) return v;
    const match = parsed.pathname.match(
      /^\/(?:shorts|embed|live|v)\/([\w-]{11})/,
    );
    if (match) return match[1];
  }
  return null;
}

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9",
  Cookie: "CONSENT=YES+cb; SOCS=CAI",
};

interface CaptionTrack {
  baseUrl: string;
  languageCode: string;
  kind?: string;
}

function pickTrack(tracks: CaptionTrack[]): CaptionTrack {
  // Prefer manually-created English, then any English, then the first track.
  return (
    tracks.find((t) => t.languageCode.startsWith("en") && t.kind !== "asr") ??
    tracks.find((t) => t.languageCode.startsWith("en")) ??
    tracks[0]
  );
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"');
}

async function fetchCaptionText(track: CaptionTrack): Promise<string> {
  const url = track.baseUrl.replace(/\\u0026/g, "&");
  const res = await fetch(url, { headers: BROWSER_HEADERS });
  if (!res.ok) {
    throw new TranscriptError(
      "BLOCKED",
      `Caption download failed with status ${res.status}.`,
    );
  }
  const xml = await res.text();
  const parts = Array.from(xml.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/g)).map(
    (m) => decodeEntities(m[1]),
  );
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

export async function fetchTranscriptDirect(videoId: string): Promise<string> {
  let html: string;
  try {
    const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: BROWSER_HEADERS,
    });
    html = await res.text();
  } catch {
    throw new TranscriptError("FETCH_FAILED", "Could not reach YouTube.");
  }

  const tracksMatch = html.match(/"captionTracks":(\[.*?\])/);
  if (!tracksMatch) {
    // YouTube serves a "sign in to confirm you're not a bot" page to
    // datacenter IPs; captions are stripped from it entirely.
    const blocked =
      html.includes("LOGIN_REQUIRED") ||
      html.includes("confirm you\u2019re not a bot") ||
      html.includes("consent.youtube.com");
    if (blocked) {
      throw new TranscriptError(
        "BLOCKED",
        "YouTube is blocking transcript requests from this server's IP.",
      );
    }
    throw new TranscriptError(
      "NO_CAPTIONS",
      "This video has no captions available.",
    );
  }

  let tracks: CaptionTrack[];
  try {
    tracks = JSON.parse(tracksMatch[1]) as CaptionTrack[];
  } catch {
    throw new TranscriptError("FETCH_FAILED", "Could not parse caption data.");
  }
  if (!tracks.length) {
    throw new TranscriptError(
      "NO_CAPTIONS",
      "This video has no captions available.",
    );
  }

  const text = await fetchCaptionText(pickTrack(tracks));
  if (!text) {
    throw new TranscriptError(
      "NO_CAPTIONS",
      "The caption track for this video is empty.",
    );
  }
  return text;
}

export async function fetchTranscriptSupadata(
  url: string,
  apiKey: string,
  lang?: string,
): Promise<string> {
  const endpoint = new URL("https://api.supadata.ai/v1/transcript");
  endpoint.searchParams.set("url", url);
  endpoint.searchParams.set("text", "true");
  endpoint.searchParams.set("mode", "auto");
  // Preferred language only: Supadata falls back to the first available
  // language when the requested one doesn't exist for the video.
  if (lang) endpoint.searchParams.set("lang", lang);

  let res: Response;
  try {
    res = await fetch(endpoint, { headers: { "x-api-key": apiKey } });
  } catch {
    throw new TranscriptError(
      "FETCH_FAILED",
      "Could not reach the transcript service.",
    );
  }

  if (res.status === 206 || res.status === 404) {
    throw new TranscriptError(
      "NO_CAPTIONS",
      "No transcript is available for this video.",
    );
  }
  if (!res.ok) {
    throw new TranscriptError(
      "FETCH_FAILED",
      `Transcript service error (status ${res.status}).`,
    );
  }

  const data = (await res.json()) as { content?: unknown; jobId?: string };
  if (typeof data.content === "string" && data.content.trim()) {
    return data.content.replace(/\s+/g, " ").trim();
  }
  // Large videos return an async job id; keep the MVP simple.
  throw new TranscriptError(
    "FETCH_FAILED",
    "This video is too long to transcribe right now. Try a shorter one.",
  );
}
