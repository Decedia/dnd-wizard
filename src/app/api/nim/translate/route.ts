import { NextResponse } from "next/server";
import { translateWithNim } from "@/lib/nim/translate";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const text = typeof body?.text === "string" ? body.text : "";
    const sourceLanguage = typeof body?.sourceLanguage === "string" ? body.sourceLanguage : "en";
    const targetLanguage = typeof body?.targetLanguage === "string" ? body.targetLanguage : "id";

    if (!text.trim()) {
      return NextResponse.json({ error: "Missing text" }, { status: 400 });
    }

    const result = await translateWithNim({ text, sourceLanguage, targetLanguage });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
