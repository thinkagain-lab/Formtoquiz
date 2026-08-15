import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_CHARS = 15000;

export async function POST(request: Request) {
  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json(
      { error: "Expected multipart/form-data with a 'file' field." },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No PDF file provided." }, { status: 400 });
  }
  if (!file.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json(
      { error: "Only .pdf files are supported." },
      { status: 400 },
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    // Import the implementation directly to avoid pdf-parse's index debug shim.
    const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default as (
      data: Buffer,
    ) => Promise<{ text: string }>;
    const parsed = await pdfParse(buffer);
    const text = parsed.text.replace(/\s+\n/g, "\n").trim().slice(0, MAX_CHARS);

    if (!text) {
      return NextResponse.json(
        { error: "Could not extract text from this PDF (it may be scanned images)." },
        { status: 422 },
      );
    }
    return NextResponse.json({ text });
  } catch (err) {
    console.error("PDF parse failed:", err);
    return NextResponse.json(
      { error: "Failed to parse PDF." },
      { status: 500 },
    );
  }
}
