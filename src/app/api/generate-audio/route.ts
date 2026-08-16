import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import { applyPronunciationReplacements } from "@/lib/pronunciationDictionary";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function handleGenerateAudio(
    spot: { name: string; location: string; description_base: string },
    language: string,
    interests: string[],
    userProfile: string = "",
    currentTopic: string = ""
) {
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY || !process.env.OPENAI_API_KEY) {
        console.error("Missing API Keys.");
        return NextResponse.json(
            { error: "API keys are not configured" },
            { status: 500 }
        );
    }

    console.log("Calling Gemini AI (Topic:", currentTopic || "Intro", "Persona:", userProfile, ")...");

    const interestStr = interests.length > 0 ? interests.join(", ") : "general highlights";

    const languageName = language === "bilingual"
        ? "Bilingual (Japanese and English)"
        : (language === "ja" ? "Japanese" : (language === "zh" ? "Chinese (Simplified)" : (language === "ru" ? "Russian" : "English")));

    const isDeepDive = Boolean(currentTopic.trim());

    const phaseGuidance = isDeepDive
        ? `* EXPLORATION PHASE: DEEP-DIVE EPISODE
          - Selected Topic: "${currentTopic.trim()}"
          - Connect this topic directly to [学び / Learning] (irreplaceable cultural origins/wisdom) and [尊敬 / Respect] (extraordinary human craft, architecture, and enduring resilience), translated seamlessly through the visitor's cognitive lens.`
        : `* EXPLORATION PHASE: INTRODUCTORY HIGHLIGHT
          - Connect to [安心 / Comfort] (relatable, engaging entry point suited to the visitor) and [発見 / Discovery] (striking observable wonders of ${spot.name}).`;

    const isBilingual = language === "bilingual";
    const isJapanese = language === "ja";

    const prompt = `
      You are an adaptive, world-class cultural heritage storyteller and audio tour guide for "${spot.name}" in ${spot.location}.
      
      SITE HERITAGE DATA:
      - Name: ${spot.name}
      - Location: ${spot.location}
      - Core Description: ${spot.description_base}
      
      VISITOR PROFILE & INPUT:
      - TARGET LANGUAGE: ${languageName} (CRITICAL: All output scripts and choices MUST be in ${languageName}!)
      - Category Interests: ${interestStr}
      - Visitor Travel Persona / Worldview: "${userProfile.trim() || "General curious traveler"}"
      ${isDeepDive ? `- Selected Topic to Explain: "${currentTopic.trim()}"` : "- Topic: Introductory Overview"}
      
      ========================================================================
      STEP 0: FACTUAL INTEGRITY & ANTI-HALLUCINATION GUARDRAILS (CRITICAL)
      ========================================================================
      - Ground your explanation strictly in verifiable historical and cultural facts about "${spot.name}".
      - STRICT BAN ON INVENTING SPECIFIC NUMBERS: Never invent specific tournament edition numbers (e.g. "第62回大会"), match scores, winning teams, exact dates, or arbitrary statistics unless 100% verified.
      - Focus on verified historical milestones, human spirit, architectural ingenuity, and timeless cultural significance rather than guessing unverified numerical details.
      
      ========================================================================
      STEP 1: DYNAMIC VISITOR COGNITIVE INFERENCE (Adaptive Heritage Guide Model)
      ========================================================================
      Analyze the visitor profile and chosen topic along 3 dimensions:
      
      1. AGE & TONE ADAPTATION:
         - Detect visitor's age group and communicative level:
           * Young / Junior (e.g. 10-15 years old / 12 years old): Speak in a friendly, enthusiastic, approachable tone suited to a kid/teen. Avoid heavy academic jargon. Explain with intuitive, vivid descriptions.
           * General / Casual Adults: Friendly, clear, engaging conversational tone.
           * Intellectual / Specialist: Polished, logical, and deeply insightful tone.
      
      2. COGNITIVE INTEREST LENS (The Visitor's Curiosity Filter):
         - Identify their primary cognitive lens from their profile (e.g. [Visual/Photogenic/Instagrammable], [Narrative/Story/Legends], [Structure/Logic/Architecture], [Food/Culture], etc.).
      
      3. HERITAGE TRANSLATION STRATEGY:
         - The genuine cultural and craftsmanship value of "${spot.name}" is the core, BUT you must translate it 100% THROUGH their cognitive lens in ${languageName}!
      
      ========================================================================
      STEP 2: 4-QUADRANT INSIGHT STRATEGY
      ========================================================================
      ${phaseGuidance}
      
      ========================================================================
      STEP 3: SCRIPT GENERATION & LANGUAGE RULES (STRICT)
      ========================================================================
      - TARGET LANGUAGE IS: ${languageName}.
      - Length: around 75-95 words (about 35-45 seconds of natural speech).
      - Use punctuation generously for natural speech cadence.
      
      Language-specific script rules:
      * For Japanese ("ja"):
        - "displayScript": Standard natural Japanese with Kanji (NO bracketed furigana).
        - "spokenScript": Phonetically tuned Japanese for TTS with difficult temple names/proper nouns written in Hiragana (e.g. せんそうじ, かみなりもん, なかみせ).
      * For Bilingual ("bilingual"):
        - "displayScript": Japanese text first, followed by clear English translation.
        - "spokenScript": Japanese (with hiragana temple names) followed by English.
      * For English ("en"), Chinese ("zh"), Russian ("ru"), or any other language:
        - "displayScript": 100% in ${languageName}.
        - "spokenScript": Identical to displayScript (100% in ${languageName}).
      
      ========================================================================
      STEP 4: NEXT 3 TOPIC CHOICES (IN ${languageName})
      ========================================================================
      Generate 3 distinct follow-up choices customized to this visitor's cognitive lens, age, AND WRITTEN IN ${languageName}:
      - Choice 1 [Learning / 学び]: A hidden origin, secret meaning, or cultural insight matching their interest lens.
      - Choice 2 [Respect / 尊敬]: An impressive artisan trick, structural wonder, or human dedication behind the sights.
      - Choice 3 [Discovery / 発見]: A secret visual spot, sensory detail, or fun thing to try right now.
      Each choice must have an emoji icon, a catchy title (under 25 chars in ${languageName}), and a prompt in ${languageName}.
      
      SOURCES & REFERENCES:
      - Provide 1 to 3 reliable, real-world source URLs for grounding and deeper reading.
      
      OUTPUT FORMAT:
      You MUST return a JSON object with this exact schema:
      {
        "displayScript": "Clean text in ${languageName}",
        "spokenScript": "Phonetically optimized text for TTS in ${languageName}",
        "nextTopics": [
          { "id": "1", "icon": "📸", "title": "Catchy Title in ${languageName}", "prompt": "Detailed question in ${languageName}" },
          { "id": "2", "icon": "✨", "title": "Catchy Title in ${languageName}", "prompt": "Detailed question in ${languageName}" },
          { "id": "3", "icon": "🔍", "title": "Catchy Title in ${languageName}", "prompt": "Detailed question in ${languageName}" }
        ],
        "sources": [
          { "title": "Official Website / Wikipedia Title", "url": "https://..." }
        ]
      }
    `;

    const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            thinkingConfig: {
                thinkingBudget: 0,
            },
            temperature: 0.3,
            maxOutputTokens: 1000,
            responseMimeType: "application/json",
            tools: [{ googleSearch: {} }],
        },
    });

    const rawText = result.text || "";
    let clean = rawText.trim();
    if (clean.startsWith("```json")) {
        clean = clean.replace(/^```json\s*/i, "").replace(/\s*```$/, "");
    } else if (clean.startsWith("```")) {
        clean = clean.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    let displayScript = "";
    let spokenScript = "";
    let nextTopics: any[] = [];
    let sources: any[] = [];

    // Extract real Grounding Web Sources from Google Search metadata if available
    const groundingChunks = (result as any).candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const webSources: Array<{ title: string; url: string }> = [];
    for (const chunk of groundingChunks) {
        if (chunk.web?.uri && chunk.web?.title) {
            webSources.push({ title: chunk.web.title, url: chunk.web.uri });
        }
    }

    try {
        const parsed = JSON.parse(clean);
        displayScript = parsed.displayScript || parsed.script || "";
        spokenScript = parsed.spokenScript || parsed.script || displayScript;
        nextTopics = Array.isArray(parsed.nextTopics) ? parsed.nextTopics : [];
        sources = Array.isArray(parsed.sources) ? parsed.sources : [];
    } catch (e) {
        console.warn("Standard JSON parse failed, running fallback regex parser:", e);
        // Regex extraction for displayScript
        const displayMatch = clean.match(/"displayScript"\s*:\s*"((?:\\.|[^"\\])*)"/);
        const spokenMatch = clean.match(/"spokenScript"\s*:\s*"((?:\\.|[^"\\])*)"/);
        const scriptMatch = clean.match(/"script"\s*:\s*"((?:\\.|[^"\\])*)"/);

        if (displayMatch) {
            displayScript = displayMatch[1].replace(/\\n/g, "\n").replace(/\\"/g, '"');
        } else if (scriptMatch) {
            displayScript = scriptMatch[1].replace(/\\n/g, "\n").replace(/\\"/g, '"');
        }

        if (spokenMatch) {
            spokenScript = spokenMatch[1].replace(/\\n/g, "\n").replace(/\\"/g, '"');
        } else {
            spokenScript = displayScript;
        }

        // Fallback nextTopics
        const topicMatches = clean.matchAll(/\{\s*"id"\s*:\s*"([^"]+)"\s*,\s*"icon"\s*:\s*"([^"]+)"\s*,\s*"title"\s*:\s*"([^"]+)"\s*,\s*"prompt"\s*:\s*"([^"]+)"\s*\}/g);
        for (const m of Array.from(topicMatches)) {
            nextTopics.push({ id: m[1], icon: m[2], title: m[3], prompt: m[4] });
        }

        // Fallback sources
        const sourceMatches = clean.matchAll(/\{\s*"title"\s*:\s*"([^"]+)"\s*,\s*"url"\s*:\s*"([^"]+)"\s*\}/g);
        for (const m of Array.from(sourceMatches)) {
            sources.push({ title: m[1], url: m[2] });
        }
    }

    // Merge Google Grounding web sources (real primary references) with parsed sources
    if (webSources.length > 0) {
        const existingUrls = new Set(sources.map((s) => s.url));
        for (const ws of webSources) {
            if (!existingUrls.has(ws.url)) {
                sources.unshift(ws);
                existingUrls.add(ws.url);
            }
        }
    }

    // Cap sources to top 3
    sources = sources.slice(0, 3);

    // Clean any remaining brackets if present
    if (displayScript.startsWith("{") && displayScript.includes('"')) {
        displayScript = displayScript.replace(/^[^{]*\{[\s\S]*?"(?:displayScript|script)"\s*:\s*"/, "").replace(/",[\s\S]*$/, "");
    }
    if (spokenScript.startsWith("{") && spokenScript.includes('"')) {
        spokenScript = spokenScript.replace(/^[^{]*\{[\s\S]*?"(?:spokenScript|script)"\s*:\s*"/, "").replace(/",[\s\S]*$/, "");
    }

    if (!displayScript) {
        displayScript = spot.description_base;
    }
    if (!spokenScript) {
        spokenScript = displayScript;
    }

    // Apply tourism & heritage pronunciation dictionary filter for Japanese
    if (isJapanese || isBilingual) {
        spokenScript = applyPronunciationReplacements(spokenScript);
    }

    console.log("Display Script length:", displayScript.length, "Spoken Script length:", spokenScript.length, "Topics:", nextTopics.length);

    // Generate Audio using OpenAI TTS (Stream directly to client with spokenScript)
    console.log("Calling OpenAI TTS with phonetically tuned script...");
    const response = await openai.audio.speech.create({
        model: "tts-1",
        voice: "alloy",
        input: spokenScript,
        response_format: "mp3",
    });

    // Encode headers safely (Send displayScript to client for UI rendering)
    const encodedScript = encodeURIComponent(displayScript);
    const encodedTopics = encodeURIComponent(JSON.stringify(nextTopics));
    const encodedSources = encodeURIComponent(JSON.stringify(sources));

    return new Response(response.body, {
        headers: {
            "Content-Type": "audio/mpeg",
            "Content-Disposition": 'inline; filename="guide.mp3"',
            "X-Script-Text": encodedScript,
            "X-Next-Topics": encodedTopics,
            "X-Sources": encodedSources,
            "Access-Control-Expose-Headers": "X-Script-Text, X-Next-Topics, X-Sources",
            "Cache-Control": "no-cache",
        },
    });
}

export async function POST(req: NextRequest) {
    try {
        const { spot, language, interests, userProfile, currentTopic } = await req.json();
        return await handleGenerateAudio(spot, language, interests || [], userProfile || "", currentTopic || "");
    } catch (error: any) {
        console.error("AI Generation Error details:", error);
        return NextResponse.json(
            { error: error.message || "Failed to generate guide" },
            { status: 500 }
        );
    }
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const name = searchParams.get("name") || "";
        const location = searchParams.get("location") || "";
        const desc = searchParams.get("desc") || "";
        const language = searchParams.get("language") || "en";
        const interestsParam = searchParams.get("interests") || "";
        const userProfile = searchParams.get("userProfile") || "";
        const currentTopic = searchParams.get("currentTopic") || "";
        const interests = interestsParam ? interestsParam.split(",") : [];

        const spot = { name, location, description_base: desc };
        return await handleGenerateAudio(spot, language, interests, userProfile, currentTopic);
    } catch (error: any) {
        console.error("AI Generation GET Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to generate guide" },
            { status: 500 }
        );
    }
}
