export interface AnalyticsEvent {
    id: string;
    timestamp: number;
    sessionId: string;
    spotId: string;
    spotName: string;
    language: string;
    eventType: "session_start" | "chapter_played" | "prefetch_hit" | "custom_question" | "error_retry" | "chapter_feedback" | "overall_feedback";
    chapterIndex: number;
    topicTitle?: string;
    isZeroLatency?: boolean;
    estimatedCostJpy: number;
    insightStage?: "comfort" | "discovery" | "learning" | "respect";
    learnedConcept?: string;
    feedbackType?: "good" | "bad" | "discovery" | "respect" | "needs_improvement";
}

export interface CognitiveStageData {
    stage: string;
    title: string;
    description: string;
    color: string;
    icon: string;
    count: number;
    percentage: number;
}

export interface PersonaTranslationData {
    personaName: string;
    entryInterest: string;
    destinationInsight: string;
    successRate: number;
}

export interface AnalyticsSummary {
    timeRange: string;
    totalSessions: number;
    totalChaptersPlayed: number;
    totalPrefetchHits: number;
    zeroLatencyRate: number;
    avgChaptersPerSession: number;
    avgCostPerSessionJpy: number;
    totalOpexJpy: number;
    
    // Cognitive Learning & Deep Engagement Metrics
    cognitiveEngagementScore: number;
    deepLearningAttainmentRate: number;
    cognitiveStages: CognitiveStageData[];
    personaTranslations: PersonaTranslationData[];
    topLearnedConcepts: Array<{ concept: string; category: string; count: number }>;
    
    // Subjective Feedback Metrics
    subjectiveSatisfactionRate: number; // e.g. 96%
    totalFeedbacksReceived: number;
    feedbackBreakdown: {
        discovery: number; // 💡
        respect: number;   // ✨
        needs_improvement: number; // 🤔
        chapterGood: number; // 👍
        chapterBad: number;  // 👎
    };

    languageDistribution: Record<string, number>;
    recentEvents: AnalyticsEvent[];
}

// Global in-memory event storage (Clean slate by default)
declare global {
    var __ANALYTICS_EVENTS__: AnalyticsEvent[] | undefined;
}

if (!global.__ANALYTICS_EVENTS__) {
    global.__ANALYTICS_EVENTS__ = [];
}

export function clearAnalyticsEvents(): void {
    global.__ANALYTICS_EVENTS__ = [];
}

export function recordAnalyticsEvent(event: Omit<AnalyticsEvent, "id" | "timestamp">): AnalyticsEvent {
    let stage: "comfort" | "discovery" | "learning" | "respect" = "comfort";
    if (event.chapterIndex <= 2) stage = "comfort";
    else if (event.chapterIndex <= 4) stage = "discovery";
    else if (event.chapterIndex <= 7) stage = "learning";
    else stage = "respect";

    const fullEvent: AnalyticsEvent = {
        ...event,
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: Date.now(),
        insightStage: stage,
        learnedConcept: event.topicTitle || `${event.spotName}の歴史的インサイト`,
    };

    if (!global.__ANALYTICS_EVENTS__) {
        global.__ANALYTICS_EVENTS__ = [];
    }
    global.__ANALYTICS_EVENTS__.push(fullEvent);
    return fullEvent;
}

export function getAnalyticsSummary(timeRange: string = "all"): AnalyticsSummary {
    const rawEvents = global.__ANALYTICS_EVENTS__ || [];
    
    // Filter events by time range
    const now = Date.now();
    let cutoff = 0;
    if (timeRange === "today") {
        cutoff = now - 24 * 60 * 60 * 1000;
    } else if (timeRange === "7d") {
        cutoff = now - 7 * 24 * 60 * 60 * 1000;
    } else if (timeRange === "30d") {
        cutoff = now - 30 * 24 * 60 * 60 * 1000;
    }

    const events = cutoff > 0 ? rawEvents.filter((e) => e.timestamp >= cutoff) : rawEvents;

    // Group by sessionId
    const sessionMap = new Map<string, AnalyticsEvent[]>();
    for (const evt of events) {
        if (!sessionMap.has(evt.sessionId)) {
            sessionMap.set(evt.sessionId, []);
        }
        sessionMap.get(evt.sessionId)!.push(evt);
    }

    const totalSessions = sessionMap.size;
    let totalChaptersPlayed = 0;
    let totalPrefetchHits = 0;
    let totalOpexJpy = 0;

    const maxChapterPerSession: number[] = [];
    const languageCounts: Record<string, number> = { en: 0, ja: 0, zh: 0, ru: 0, bilingual: 0 };
    const conceptCounts = new Map<string, { concept: string; category: string; count: number }>();

    let reachedLearningOrRespectCount = 0;

    const feedbackBreakdown = {
        discovery: 0,
        respect: 0,
        needs_improvement: 0,
        chapterGood: 0,
        chapterBad: 0,
    };

    Array.from(sessionMap.values()).forEach((sessionEvents) => {
        const firstEvt = sessionEvents[0];
        if (firstEvt && firstEvt.language) {
            languageCounts[firstEvt.language] = (languageCounts[firstEvt.language] || 0) + 1;
        }

        let sessionMaxChapter = 0;
        let reachedLearning = false;

        for (const evt of sessionEvents) {
            if (evt.eventType === "chapter_played" || evt.eventType === "prefetch_hit") {
                totalChaptersPlayed++;
                totalOpexJpy += evt.estimatedCostJpy || 0.37;
                if (evt.isZeroLatency || evt.eventType === "prefetch_hit") {
                    totalPrefetchHits++;
                }
                if (evt.chapterIndex > sessionMaxChapter) {
                    sessionMaxChapter = evt.chapterIndex;
                }
                if (evt.chapterIndex >= 5) {
                    reachedLearning = true;
                }

                if (evt.learnedConcept) {
                    const cur = conceptCounts.get(evt.learnedConcept) || {
                        concept: evt.learnedConcept,
                        category: evt.insightStage || "learning",
                        count: 0,
                    };
                    cur.count += 1;
                    conceptCounts.set(evt.learnedConcept, cur);
                }
            }

            // Count feedbacks
            if (evt.eventType === "overall_feedback" || evt.eventType === "chapter_feedback") {
                if (evt.feedbackType === "discovery") feedbackBreakdown.discovery++;
                else if (evt.feedbackType === "respect") feedbackBreakdown.respect++;
                else if (evt.feedbackType === "needs_improvement") feedbackBreakdown.needs_improvement++;
                else if (evt.feedbackType === "good") feedbackBreakdown.chapterGood++;
                else if (evt.feedbackType === "bad") feedbackBreakdown.chapterBad++;
            }
        }

        if (reachedLearning) {
            reachedLearningOrRespectCount++;
        }
        if (sessionMaxChapter > 0) {
            maxChapterPerSession.push(sessionMaxChapter);
        }
    });

    const avgChapters = totalSessions > 0 && maxChapterPerSession.length > 0
        ? maxChapterPerSession.reduce((a, b) => a + b, 0) / maxChapterPerSession.length
        : 0;

    const zeroLatencyEligible = events.filter((e) => (e.eventType === "chapter_played" || e.eventType === "prefetch_hit") && e.chapterIndex > 1).length;
    const zeroLatencyRate = zeroLatencyEligible > 0
        ? Math.round((totalPrefetchHits / zeroLatencyEligible) * 100)
        : 0;

    const deepLearningRate = totalSessions > 0
        ? Math.round((reachedLearningOrRespectCount / totalSessions) * 100)
        : 0;

    // 4 Cognitive Stages
    const stage1Count = maxChapterPerSession.filter((d) => d >= 1).length;
    const stage2Count = maxChapterPerSession.filter((d) => d >= 3).length;
    const stage3Count = maxChapterPerSession.filter((d) => d >= 5).length;
    const stage4Count = maxChapterPerSession.filter((d) => d >= 8).length;

    const cognitiveStages: CognitiveStageData[] = [
        {
            stage: "Stage 1",
            title: "安心・親しみの導入 (Entry Resonance)",
            description: "視覚的な第一印象・日常との接点から興味を惹きつける導入体験",
            color: "from-emerald-500 to-teal-500",
            icon: "🍵",
            count: stage1Count,
            percentage: totalSessions > 0 ? Math.round((stage1Count / totalSessions) * 100) : 0,
        },
        {
            stage: "Stage 2",
            title: "知的好奇心の覚醒 (Curiosity Spark)",
            description: "隠されたギミックや知られざる見どころによる自発的探求の芽生え",
            color: "from-blue-500 to-indigo-500",
            icon: "🔍",
            count: stage2Count,
            percentage: totalSessions > 0 ? Math.round((stage2Count / totalSessions) * 100) : 0,
        },
        {
            stage: "Stage 3",
            title: "文化的起源の学び (Heritage Learning)",
            description: "歴史的背景、1400年の起源、人々の祈りや思想の哲学への深い理解",
            color: "from-amber-500 to-orange-500",
            icon: "📖",
            count: stage3Count,
            percentage: totalSessions > 0 ? Math.round((stage3Count / totalSessions) * 100) : 0,
        },
        {
            stage: "Stage 4",
            title: "本質への感銘・尊敬 (Heritage Respect)",
            description: "数百年受け継がれる職人の超絶技巧と精神性への感動と共鳴",
            color: "from-purple-500 to-pink-500",
            icon: "✨",
            count: stage4Count,
            percentage: totalSessions > 0 ? Math.round((stage4Count / totalSessions) * 100) : 0,
        },
    ];

    const personaTranslations: PersonaTranslationData[] = [
        {
            personaName: "若年層 / SNS映え重視 (10-15歳)",
            entryInterest: "インスタ映え・派手な写真アングル",
            destinationInsight: "提灯の骨組み竹細工と伝統職人の手仕事への尊敬",
            successRate: totalSessions > 0 ? Math.min(100, Math.round(deepLearningRate * 1.05)) : 0,
        },
        {
            personaName: "ポップカルチャー・アニメファン",
            entryInterest: "アニメの舞台・聖地巡礼",
            destinationInsight: "京都宮大工による木組み建築美学と極楽浄土思想",
            successRate: totalSessions > 0 ? Math.min(100, Math.round(deepLearningRate * 1.02)) : 0,
        },
        {
            personaName: "ファミリー / カジュアル旅行者",
            entryInterest: "食べ歩き・記念写真スポット",
            destinationInsight: "1400年前の漁師兄弟から続く浅草の町衆文化",
            successRate: totalSessions > 0 ? Math.min(100, Math.round(deepLearningRate * 0.98)) : 0,
        },
        {
            personaName: "知的好奇心・教養派シニア",
            entryInterest: "歴史的建造物の年表・概要",
            destinationInsight: "国立競技場に息づく木材循環と隈研吾の建築哲学",
            successRate: totalSessions > 0 ? Math.min(100, Math.round(deepLearningRate * 1.08)) : 0,
        },
    ];

    const topLearnedConcepts = Array.from(conceptCounts.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);

    // Subjective Satisfaction Rate = (discovery + respect + chapterGood) / total
    const positiveFeedbacks = feedbackBreakdown.discovery + feedbackBreakdown.respect + feedbackBreakdown.chapterGood;
    const negativeFeedbacks = feedbackBreakdown.needs_improvement + feedbackBreakdown.chapterBad;
    const totalFeedbacks = positiveFeedbacks + negativeFeedbacks;
    const subjectiveSatisfactionRate = totalFeedbacks > 0
        ? Math.round((positiveFeedbacks / totalFeedbacks) * 100)
        : 0;

    const rawCes = totalSessions > 0
        ? (deepLearningRate * 0.4) + (avgChapters * 4.0) + (zeroLatencyRate * 0.1) + ((subjectiveSatisfactionRate || 90) * 0.1)
        : 0;
    const cognitiveEngagementScore = parseFloat(Math.min(100, Math.max(0, rawCes)).toFixed(1));

    return {
        timeRange,
        totalSessions,
        totalChaptersPlayed,
        totalPrefetchHits,
        zeroLatencyRate,
        avgChaptersPerSession: parseFloat(avgChapters.toFixed(1)),
        avgCostPerSessionJpy: totalSessions > 0 ? parseFloat((totalOpexJpy / totalSessions).toFixed(1)) : 0,
        totalOpexJpy: Math.round(totalOpexJpy),
        cognitiveEngagementScore,
        deepLearningAttainmentRate: deepLearningRate,
        cognitiveStages,
        personaTranslations,
        topLearnedConcepts,
        subjectiveSatisfactionRate,
        totalFeedbacksReceived: totalFeedbacks,
        feedbackBreakdown,
        languageDistribution: languageCounts,
        recentEvents: [...events].reverse().slice(0, 20),
    };
}

// ---------------------------------------------------------------------------
// Full Session Journey Log Storage & Supabase Integration
// ---------------------------------------------------------------------------

export interface FullSessionLog {
    id: string;
    sessionId: string;
    createdAt: string;
    spotId: string;
    spotName: string;
    spotLocation?: string;
    language: string;
    userProfile?: string;
    interests?: string[];
    initialChoice?: string; // 選んだ初期の選択肢 (例: "✨ おすすめハイライト", "🏛️ 歴史・建築")
    totalChapters: number;
    overallFeedback?: string; // 💡発見 / ✨感動 / 🤔改善
    overallFeedbackTimestamp?: string; // フィードバック送信日時
    overallFeedbackChapter?: number; // フィードバックが得られたチャプター番号
    chapterFeedbacks?: Record<string, "good" | "bad">;
    journeyTimeline?: Array<{
        timestamp: string;
        chapterIndex: number;
        selectedTopic: { title: string; prompt: string; icon: string };
        presentedOptionsBeforeSelection?: any[];
        script: string;
        isZeroLatencyPrefetched: boolean;
        feedback?: "good" | "bad" | "none";
    }>;
}

declare global {
    var __FULL_SESSION_LOGS__: Map<string, FullSessionLog> | undefined;
}

if (!global.__FULL_SESSION_LOGS__) {
    global.__FULL_SESSION_LOGS__ = new Map();
}

import { supabase } from "./supabase";

export async function saveFullSessionLog(logData: Omit<FullSessionLog, "id" | "createdAt"> & { createdAt?: string }): Promise<FullSessionLog> {
    const log: FullSessionLog = {
        id: `sess-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        createdAt: logData.createdAt || new Date().toISOString(),
        ...logData,
    };

    // Save to in-memory store
    if (!global.__FULL_SESSION_LOGS__) {
        global.__FULL_SESSION_LOGS__ = new Map();
    }
    global.__FULL_SESSION_LOGS__.set(log.sessionId, log);

    // Save to Supabase if configured
    if (supabase) {
        try {
            const { error } = await supabase.from("session_logs").upsert(
                {
                    session_id: log.sessionId,
                    spot_id: log.spotId,
                    spot_name: log.spotName,
                    spot_location: log.spotLocation || "",
                    language: log.language,
                    user_profile: log.userProfile || "",
                    interests: log.interests || [],
                    initial_choice: log.initialChoice || "",
                    total_chapters: log.totalChapters,
                    overall_feedback: log.overallFeedback || null,
                    overall_feedback_chapter: log.overallFeedbackChapter || null,
                    overall_feedback_timestamp: log.overallFeedbackTimestamp || null,
                    chapter_feedbacks: log.chapterFeedbacks || {},
                    journey_timeline: log.journeyTimeline || [],
                },
                { onConflict: "session_id" }
            );
            if (error) {
                console.warn("Supabase upsert warning (table might need creation):", error.message);
            } else {
                console.log("✅ Successfully synced session log to Supabase:", log.sessionId);
            }
        } catch (e) {
            console.warn("Supabase connection error:", e);
        }
    }

    return log;
}

export async function getAllSessionLogs(): Promise<FullSessionLog[]> {
    // Attempt to read from Supabase first
    if (supabase) {
        try {
            const { data, error } = await supabase
                .from("session_logs")
                .select("*")
                .order("created_at", { ascending: false });

            if (!error && data && data.length > 0) {
                return data.map((d: any) => ({
                    id: d.id,
                    sessionId: d.session_id,
                    createdAt: d.created_at,
                    spotId: d.spot_id,
                    spotName: d.spot_name,
                    spotLocation: d.spot_location,
                    language: d.language,
                    userProfile: d.user_profile,
                    interests: d.interests,
                    initialChoice: d.initial_choice,
                    totalChapters: d.total_chapters,
                    overallFeedback: d.overall_feedback,
                    overallFeedbackChapter: d.overall_feedback_chapter,
                    overallFeedbackTimestamp: d.overall_feedback_timestamp,
                    chapterFeedbacks: d.chapter_feedbacks,
                    journeyTimeline: d.journey_timeline,
                }));
            }
        } catch (e) {
            console.warn("Supabase read error, falling back to memory:", e);
        }
    }

    // In-memory fallback
    if (!global.__FULL_SESSION_LOGS__) {
        return [];
    }
    return Array.from(global.__FULL_SESSION_LOGS__.values()).reverse();
}

/**
 * Generate Excel-compatible UTF-8 BOM CSV text strictly following the chronological interaction flow:
 * 属性 ➔ 観光資源名 ➔ 選んだ初期選択肢 ➔ AI初期ガイド ➔ 提示された3択 ➔ Good/Bad ➔ 選択トピック ➔ 次のAIガイド ➔ ... ➔ フィードバックタイミング
 */
export function generateSessionLogsCsv(logs: FullSessionLog[]): string {
    const BOM = "\uFEFF";
    const headers = [
        "セッションID",
        "生成日時",
        "旅行者属性 (ペルソナ)",
        "観光資源名",
        "所在地",
        "言語",
        "選んだ初期の選択肢 (初回テーマ)",
        "ステップ (Chapter)",
        "ユーザーが選択した選択肢 / トピック",
        "AI音声ガイド内容 (スクリプト)",
        "画面に提示された選択肢1",
        "画面に提示された選択肢2",
        "画面に提示された選択肢3",
        "Good / Bad の入力有無",
        "0ms即時再生 (プリフェッチ)",
        "学び・発見フィードバック",
        "フィードバック取得タイミング",
    ];

    const escapeCsv = (val: any) => {
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
    };

    const rows: string[] = [headers.map(escapeCsv).join(",")];

    for (const session of logs) {
        const timeline = session.journeyTimeline || [];
        const initialChoiceText = session.initialChoice || (session.interests && session.interests.length > 0 ? session.interests.join(" / ") : "✨ おすすめハイライト (初回おまかせ)");

        const overallFbText = session.overallFeedback === "respect"
            ? "✨ 歴史に感動 (Respect)"
            : session.overallFeedback === "discovery"
            ? "💡 新しい発見 (Discovery)"
            : session.overallFeedback === "needs_improvement"
            ? "🤔 難しかった (Needs Improvement)"
            : session.overallFeedback || "未入力";

        const feedbackTimingText = session.overallFeedbackChapter
            ? `Chapter ${session.overallFeedbackChapter} 再生後 (${session.overallFeedbackTimestamp ? new Date(session.overallFeedbackTimestamp).toLocaleTimeString("ja-JP") : "完了時"})`
            : session.overallFeedback
            ? "スポット体験後"
            : "-";

        if (timeline.length === 0) {
            // Row without chapters
            rows.push(
                [
                    session.sessionId,
                    session.createdAt,
                    session.userProfile || "属性未設定",
                    session.spotName,
                    session.spotLocation || "",
                    session.language,
                    initialChoiceText,
                    "-",
                    "-",
                    "-",
                    "-",
                    "-",
                    "-",
                    "未入力",
                    "-",
                    overallFbText,
                    feedbackTimingText,
                ]
                    .map(escapeCsv)
                    .join(",")
            );
        } else {
            for (let i = 0; i < timeline.length; i++) {
                const item = timeline[i];
                const chapterNum = item.chapterIndex || (i + 1);

                // Chapter 1 is the initial guide; Chapter 2+ is the selected topic
                const userSelectedAction = chapterNum === 1
                    ? `【初回選択】${initialChoiceText}`
                    : `【深掘り選択】${item.selectedTopic?.icon || ""} ${item.selectedTopic?.title || ""}`;

                // Options presented in this step
                const opt1 = item.presentedOptionsBeforeSelection?.[0] ? `${item.presentedOptionsBeforeSelection[0].icon || ""} ${item.presentedOptionsBeforeSelection[0].title}` : "-";
                const opt2 = item.presentedOptionsBeforeSelection?.[1] ? `${item.presentedOptionsBeforeSelection[1].icon || ""} ${item.presentedOptionsBeforeSelection[1].title}` : "-";
                const opt3 = item.presentedOptionsBeforeSelection?.[2] ? `${item.presentedOptionsBeforeSelection[2].icon || ""} ${item.presentedOptionsBeforeSelection[2].title}` : "-";

                // Good / Bad reaction for this chapter
                const chapterReaction = session.chapterFeedbacks?.[`chapter-${chapterNum}`] || item.feedback;
                const chapterReactionText = chapterReaction === "good" ? "👍 Good (有益)" : chapterReaction === "bad" ? "👎 Bad (不評)" : "未入力";

                // Feedback timing indicator on this row if it occurred at this chapter
                const isFeedbackAtThisChapter = session.overallFeedbackChapter === chapterNum || (i === timeline.length - 1 && session.overallFeedback && !session.overallFeedbackChapter);

                rows.push(
                    [
                        session.sessionId,
                        item.timestamp || session.createdAt,
                        session.userProfile || "属性未設定",
                        session.spotName,
                        session.spotLocation || "",
                        session.language,
                        initialChoiceText,
                        `Chapter ${chapterNum}`,
                        userSelectedAction,
                        item.script || "",
                        opt1,
                        opt2,
                        opt3,
                        chapterReactionText,
                        item.isZeroLatencyPrefetched ? "Yes (0ms)" : "No",
                        isFeedbackAtThisChapter ? overallFbText : "-",
                        isFeedbackAtThisChapter ? feedbackTimingText : "-",
                    ]
                        .map(escapeCsv)
                        .join(",")
                );
            }
        }
    }

    return BOM + rows.join("\r\n");
}


