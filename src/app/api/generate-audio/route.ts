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

    const isBilingual = language === "bilingual";
    const isJapanese = language === "ja";

    const isDeepDive = Boolean(currentTopic.trim());

    const phaseGuidance = isDeepDive
        ? `* EXPLORATION PHASE: DEEP-DIVE EPISODE
          - Selected Topic: "${currentTopic.trim()}"
          - Connect this topic directly to [学び / Learning] (irreplaceable cultural origins/wisdom) and [尊敬 / Respect] (extraordinary human craft, architecture, and enduring resilience), translated seamlessly through the visitor's cognitive lens.`
        : `* EXPLORATION PHASE: INTRODUCTORY HIGHLIGHT
          - Connect to [安心 / Comfort] (relatable, engaging entry point suited to the visitor) and [発見 / Discovery] (striking observable wonders of ${spot.name}).`;

    const hasValidDesc = spot.description_base && !spot.description_base.includes("No description available");
    const siteContext = hasValidDesc
        ? `Core Description: ${spot.description_base}`
        : `Note: Use Google Search to look up the exact history, highlights, and cultural importance of "${spot.name}" in ${spot.location}.`;

    const prompt = `
      You are an adaptive, world-class cultural heritage storyteller and audio tour guide for "${spot.name}" in ${spot.location}.
      
      SITE HERITAGE DATA:
      - Name: ${spot.name}
      - Location: ${spot.location}
      - ${siteContext}
      
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
      STEP 3: SCRIPT GENERATION & LANGUAGE RULES (STRICT COMPLETENESS)
      ========================================================================
      - TARGET LANGUAGE IS: ${languageName}.
      - SCRIPT LENGTH & COMPLETENESS:
        * Japanese ("ja"): exactly 3 to 5 complete sentences (around 160-220 characters).
        * English ("en") / other languages: exactly 3 to 5 complete sentences (around 70-95 words).
        * STRICT ENDING: The script MUST ALWAYS be a complete, self-contained story that ends with proper concluding punctuation (「。」, 「！」, ".", or "!"). NEVER leave a sentence hanging or cut off midway!
      - Use natural punctuation generously for pleasant speech cadence.
      
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
      
      OUTPUT FORMAT (CRITICAL):
      You MUST return ONLY a valid, parseable RFC-8259 JSON object.
      DO NOT output YAML, DO NOT output plain key-value text like "displayScript: ...", and DO NOT add explanations outside the JSON.
      
      Exact Schema:
      {
        "displayScript": "Complete, polished script in ${languageName}",
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
            maxOutputTokens: 2500,
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
        console.warn("Standard JSON parse failed, running fallback parsers (JSON & YAML):", e);

        // 1. JSON Regex extraction
        const jsonDisplayMatch = clean.match(/"displayScript"\s*:\s*"((?:\\.|[^"\\])*)"/);
        const jsonSpokenMatch = clean.match(/"spokenScript"\s*:\s*"((?:\\.|[^"\\])*)"/);
        const jsonScriptMatch = clean.match(/"script"\s*:\s*"((?:\\.|[^"\\])*)"/);

        if (jsonDisplayMatch) {
            displayScript = jsonDisplayMatch[1].replace(/\\n/g, "\n").replace(/\\"/g, '"');
        } else if (jsonScriptMatch) {
            displayScript = jsonScriptMatch[1].replace(/\\n/g, "\n").replace(/\\"/g, '"');
        }

        if (jsonSpokenMatch) {
            spokenScript = jsonSpokenMatch[1].replace(/\\n/g, "\n").replace(/\\"/g, '"');
        }

        // 2. YAML / Key-Value Regex extraction (e.g. displayScript: ... \n spokenScript: ...)
        if (!displayScript) {
            const yamlDisplayMatch = clean.match(/(?:^|\n)\s*displayScript\s*:\s*["']?([\s\S]*?)(?=(?:\n\s*spokenScript|\n\s*nextTopics|\n\s*sources|["']?\s*$))/i);
            if (yamlDisplayMatch) {
                displayScript = yamlDisplayMatch[1].trim().replace(/^["']|["']$/g, "");
            }
        }

        if (!spokenScript) {
            const yamlSpokenMatch = clean.match(/(?:^|\n)\s*spokenScript\s*:\s*["']?([\s\S]*?)(?=(?:\n\s*nextTopics|\n\s*sources|["']?\s*$))/i);
            if (yamlSpokenMatch) {
                spokenScript = yamlSpokenMatch[1].trim().replace(/^["']|["']$/g, "");
            }
        }

        // 3. Omni-Parser: If raw text without keys, use directly
        if (!displayScript && clean.length > 20 && !clean.startsWith("{") && !clean.includes("displayScript:")) {
            const strippedText = clean.replace(/^#+\s*.*$/gm, "").trim();
            if (strippedText.length > 20) {
                displayScript = strippedText;
                spokenScript = strippedText;
            }
        }

        if (!spokenScript) {
            spokenScript = displayScript;
        }

        // Fallback nextTopics (JSON style)
        const topicMatches = clean.matchAll(/\{\s*"id"\s*:\s*"([^"]+)"\s*,\s*"icon"\s*:\s*"([^"]+)"\s*,\s*"title"\s*:\s*"([^"]+)"\s*,\s*"prompt"\s*:\s*"([^"]+)"\s*\}/g);
        for (const m of Array.from(topicMatches)) {
            nextTopics.push({ id: m[1], icon: m[2], title: m[3], prompt: m[4] });
        }

        // Fallback nextTopics (YAML style: - id: "1" \n icon: "📸" ...)
        if (nextTopics.length === 0 && clean.includes("nextTopics:")) {
            const yamlTopicBlocks = clean.split(/-\s*id\s*:/i).slice(1);
            for (const block of yamlTopicBlocks) {
                const titleM = block.match(/title\s*:\s*["']?([^"\n\r]+)["']?/i);
                const promptM = block.match(/prompt\s*:\s*["']?([^"\n\r]+)["']?/i);
                const iconM = block.match(/icon\s*:\s*["']?([^"\n\r]+)["']?/i);
                if (titleM && promptM) {
                    nextTopics.push({
                        id: `ytopic-${Date.now()}-${nextTopics.length}`,
                        icon: iconM ? iconM[1].trim() : "✨",
                        title: titleM[1].trim(),
                        prompt: promptM[1].trim(),
                    });
                }
            }
        }

        // Fallback sources
        const sourceMatches = clean.matchAll(/\{\s*"title"\s*:\s*"([^"]+)"\s*,\s*"url"\s*:\s*"([^"]+)"\s*\}/g);
        for (const m of Array.from(sourceMatches)) {
            sources.push({ title: m[1], url: m[2] });
        }
    }

    // Sanitize displayScript & spokenScript: strip any leaked keys like "displayScript:", "spokenScript:", "nextTopics:"
    function cleanScriptText(text: string): string {
        let cleaned = text.trim();
        // Remove leading displayScript: or spokenScript:
        cleaned = cleaned.replace(/^(?:displayScript|spokenScript|script)\s*:\s*["']?/i, "");
        // If nextTopics or spokenScript leaked into the text, cut off before them
        cleaned = cleaned.split(/(?:\n\s*spokenScript:|\n\s*nextTopics:|\n\s*sources:)/i)[0];
        // Clean leading/trailing quotes
        cleaned = cleaned.replace(/^["']|["']$/g, "").trim();
        return cleaned;
    }

    displayScript = cleanScriptText(displayScript);
    spokenScript = cleanScriptText(spokenScript);

    // Ensure sentence is not cut off midway if a truncation occurred
    function ensureCompleteSentence(text: string): string {
        const trimmed = text.trim();
        if (!trimmed) return trimmed;
        // If it doesn't end with a closing punctuation, find the last valid sentence terminator
        const validEnds = ["。", "！", "？", ".", "!", "?"];
        if (!validEnds.some((end) => trimmed.endsWith(end))) {
            const lastPeriod = Math.max(
                trimmed.lastIndexOf("。"),
                trimmed.lastIndexOf("！"),
                trimmed.lastIndexOf("？"),
                trimmed.lastIndexOf("."),
                trimmed.lastIndexOf("!")
            );
            if (lastPeriod > 40) {
                return trimmed.slice(0, lastPeriod + 1);
            }
            return trimmed + "。";
        }
        return trimmed;
    }

    displayScript = ensureCompleteSentence(displayScript);
    spokenScript = ensureCompleteSentence(spokenScript);

    // Deduplicate nextTopics by title/prompt and cap strictly to 3
    const uniqueTopics: any[] = [];
    const seenTitles = new Set<string>();
    for (const t of nextTopics) {
        const titleKey = (t.title || t.prompt || "").trim();
        if (titleKey && !seenTitles.has(titleKey)) {
            seenTitles.add(titleKey);
            uniqueTopics.push(t);
        }
    }
    nextTopics = uniqueTopics.slice(0, 3);

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

    // Strict validation: NEVER fallback to "No description available"
    if (!displayScript || displayScript.includes("No description available")) {
        if (hasValidDesc) {
            displayScript = spot.description_base;
        } else {
            console.error("AI failed to generate a valid guide script for spot:", spot.name);
            return NextResponse.json(
                { error: "ガイド原稿の生成に失敗しました。もう一度お試しください。" },
                { status: 500 }
            );
        }
    }
    if (!spokenScript || spokenScript.includes("No description available")) {
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
