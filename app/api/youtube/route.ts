import { NextResponse } from "next/server";
import {
  TranscriptError,
  extractVideoId,
  fetchTranscriptDirect,
  fetchTranscriptSupadata,
} from "@/lib/youtube";

export const runtime = "nodejs";

const MAX_CHARS = 15000;

const ERROR_MESSAGES: Record<string, string> = {
  BAD_URL: "That doesn't look like a valid YouTube URL.",
  NO_CAPTIONS:
    "This video has no captions/transcript available. Try a different video, or paste the content as text instead.",
  BLOCKED:
    "YouTube blocks transcript requests from cloud servers. Copy the transcript from YouTube (open the video, expand the description, click \"Show transcript\") and paste it as text — or ask the site owner to configure a transcript API key.",
  FETCH_FAILED:
    "Could not fetch the transcript right now. Please try again, or paste the transcript as text instead.",
};

// Map the quiz UI language setting to an ISO 639-1 transcript preference.
const LANG_MAP: Record<string, string> = {
  english: "en",
  hindi: "hi",
  hinglish: "hi",
};

export async function POST(request: Request) {
  let body: { url?: string; language?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const url = (body.url ?? "").toString().trim();
  if (!url) {
    return NextResponse.json(
      { error: "No YouTube URL provided.", code: "BAD_URL" },
      { status: 400 },
    );
  }

  const videoId = extractVideoId(url);
  if (!videoId) {
    return NextResponse.json(
      { error: ERROR_MESSAGES.BAD_URL, code: "BAD_URL" },
      { status: 400 },
    );
  }

  const supadataKey = process.env.SUPADATA_API_KEY;

  try {
    let text: string;
    if (supadataKey) {
      // Hosted API first: it's the only method that works from cloud IPs.
      try {
        text = await fetchTranscriptSupadata(
          `https://www.youtube.com/watch?v=${videoId}`,
          supadataKey,
          LANG_MAP[(body.language ?? "").toLowerCase()] ?? "en",
        );
      } catch (err) {
        if (err instanceof TranscriptError && err.code === "NO_CAPTIONS") {
          throw err;
        }
        text = await fetchTranscriptDirect(videoId);
      }
    } else {
      text = await fetchTranscriptDirect(videoId);
    }

    text = text.slice(0, MAX_CHARS);
    if (!text) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.NO_CAPTIONS, code: "NO_CAPTIONS" },
        { status: 422 },
      );
    }
    return NextResponse.json({ text });
  } catch (err) {
    console.error("YouTube transcript fetch failed:", err);
    const code = err instanceof TranscriptError ? err.code : "FETCH_FAILED";
    return NextResponse.json(
      { error: ERROR_MESSAGES[code], code },
      { status: 422 },
    );
  }
}
