import { NextResponse } from "next/server";
import { YoutubeTranscript } from "youtube-transcript";

export const runtime = "nodejs";

const MAX_CHARS = 15000;

export async function POST(request: Request) {
  let body: { url?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const url = (body.url ?? "").toString().trim();
  if (!url) {
    return NextResponse.json({ error: "No YouTube URL provided." }, { status: 400 });
  }

  try {
    const items = await YoutubeTranscript.fetchTranscript(url);
    const text = items
      .map((i) => i.text)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, MAX_CHARS);

    if (!text) {
      return NextResponse.json(
        { error: "No transcript found for this video." },
        { status: 422 },
      );
    }
    return NextResponse.json({ text });
  } catch (err) {
    console.error("YouTube transcript fetch failed:", err);
    return NextResponse.json(
      {
        error:
          "Could not fetch a transcript for this video. It may have captions disabled, or the region may be restricted. Try pasting the transcript as text instead.",
      },
      { status: 422 },
    );
  }
}
