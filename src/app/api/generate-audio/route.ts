import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
    try {
        const { spot, language, interests } = await req.json();
        console.log("Generating audio for spot:", spot.name, "Language:", language, "Interests:", interests);

        if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY || !process.env.OPENAI_API_KEY) {
            console.error("Missing API Keys. GOOGLE:", !!process.env.GOOGLE_GENERATIVE_AI_API_KEY, "OPENAI:", !!process.env.OPENAI_API_KEY);
            return NextResponse.json(
                { error: "API keys are not configured" },
                { status: 500 }
            );
        }

        // 1. Generate Script using Gemini
        console.log("Calling Gemini AI (Model: gemini-2.5-flash)...");
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const interestStr = interests.length > 0 ? interests.join(", ") : "general information";

        const languageName = language === "bilingual" ? "Bilingual (Japanese and English)" : (language === "ja" ? "Japanese" : "English");

        const prompt = language === "bilingual"
            ? `
      You are a professional tour guide. Create a short, engaging audio guide script for "${spot.name}" in ${spot.location}.
      
      Site Info:
      - Description: ${spot.description_base}
      
      User Preferences:
      - Language: Bilingual (Japanese and English)
      - Interests: ${interestStr}
      
      REQUIREMENTS FOR JAPANESE TEXT (FOR TTS):
      - Ensure proper nouns (place names, people, etc.) and difficult kanji are written in a way that is easy for text-to-speech to pronounce correctly. Use Hiragana in brackets if needed, e.g., 浅草寺(せんそうじ).
      - Use punctuation (、, 。) generously to ensure natural pacing and intonation in the audio.
      
      GENERAL REQUIREMENTS:
      - The script MUST be bilingual (Japanese and English).
      - For each section, provide the Japanese text first, followed by the English translation.
      - Focus deeply on the user's interests: ${interestStr}.
      - If the description is limited, use your knowledge about "${spot.name}" to provide rich details.
      - Total length MUST be around 150-180 words total to ensure about 1 minute of speech.
      - Output ONLY the script text, no metadata or extra notes.
      - Start with a short intro, then the main highlights, and end with a nice closing.
    `
            : `
      You are a professional tour guide. Create a short, engaging audio guide script for "${spot.name}" in ${spot.location}.
      
      Site Info:
      - Description: ${spot.description_base}
      
      User Preferences:
      - Language: ${languageName}
      - Interests: ${interestStr}
      
      REQUIREMENTS FOR JAPANESE (FOR TTS ACCURACY):
      - THIS IS CRITICAL: For Japanese scripts, ensure proper nouns (place names, etc.) and difficult kanji are written in a way that is easy for text-to-speech to pronounce correctly. 
      - Use Hiragana for difficult names or provide phonetic hints in brackets, e.g., 浅草寺(せんそうじ).
      - Use punctuation (、, 。) frequently to create natural pauses during speech.
      
      GENERAL REQUIREMENTS:
      - The script MUST be entirely in ${languageName}.
      - Focus deeply on the user's interests: ${interestStr}.
      - If the description is limited, use your knowledge about "${spot.name}" to provide rich details.
      - Total length MUST be around 120-150 words to ensure about 1 minute of speech.
      - Output ONLY the script text, no metadata or extra notes.
      - Start with a short intro, then the main highlights, and end with a nice closing.
    `;

        const result = await model.generateContent(prompt);
        const script = result.response.text();
        console.log("Script generated successfully. Length:", script?.length);

        if (!script) {
            throw new Error("Failed to generate script from Gemini");
        }

        // 2. Generate Audio using OpenAI TTS
        console.log("Calling OpenAI TTS...");
        const mp3 = await openai.audio.speech.create({
            model: "tts-1",
            voice: "alloy",
            input: script,
        });

        const buffer = Buffer.from(await mp3.arrayBuffer());
        console.log("Audio generated successfully. Buffer size:", buffer.length);

        return new NextResponse(buffer, {
            headers: {
                "Content-Type": "audio/mpeg",
                "Content-Disposition": `attachment; filename="guide.mp3"`,
            },
        });
    } catch (error: any) {
        console.error("AI Generation Error details:", error);
        return NextResponse.json(
            { error: error.message || "Failed to generate guide" },
            { status: 500 }
        );
    }
}
