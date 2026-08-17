import { NextRequest, NextResponse } from "next/server";
import {
    getAnalyticsSummary,
    recordAnalyticsEvent,
    clearAnalyticsEvents,
    saveFullSessionLog,
    getAllSessionLogs,
    generateSessionLogsCsv,
} from "@/lib/analyticsStore";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const format = searchParams.get("format");
        const type = searchParams.get("type");
        const timeRange = searchParams.get("range") || "all";

        // 1. CSV Download Endpoint
        if (format === "csv") {
            const logs = await getAllSessionLogs();
            const csv = generateSessionLogsCsv(logs);
            const filename = `inbound_ai_guide_logs_${new Date().toISOString().slice(0, 10)}.csv`;

            return new Response(csv, {
                headers: {
                    "Content-Type": "text/csv; charset=utf-8",
                    "Content-Disposition": `attachment; filename="${filename}"`,
                    "Cache-Control": "no-cache",
                },
            });
        }

        // 2. Full Sessions JSON Endpoint
        if (type === "sessions") {
            const logs = await getAllSessionLogs();
            return NextResponse.json({ success: true, count: logs.length, sessions: logs });
        }

        // 3. Default Analytics Dashboard Summary
        const summary = getAnalyticsSummary(timeRange);
        return NextResponse.json(summary);
    } catch (error: any) {
        console.error("Analytics GET Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // 1. Handle Full Session Log sync (Supabase & in-memory)
        if (body.type === "full_session_sync" || body.journeyTimeline) {
            const {
                sessionId,
                spotId,
                spotName,
                spotLocation,
                language,
                userProfile,
                interests,
                totalChapters,
                overallFeedback,
                chapterFeedbacks,
                journeyTimeline,
            } = body;

            if (!sessionId || !spotId) {
                return NextResponse.json({ error: "Missing sessionId or spotId" }, { status: 400 });
            }

            const savedLog = await saveFullSessionLog({
                sessionId,
                spotId,
                spotName: spotName || "Unknown Spot",
                spotLocation: spotLocation || "",
                language: language || "en",
                userProfile: userProfile || "",
                interests: interests || [],
                totalChapters: totalChapters || 1,
                overallFeedback: overallFeedback || null,
                chapterFeedbacks: chapterFeedbacks || {},
                journeyTimeline: journeyTimeline || [],
            });

            return NextResponse.json({ success: true, log: savedLog });
        }

        // 2. Handle standard micro analytics events
        const { sessionId, spotId, spotName, language, eventType, chapterIndex, topicTitle, isZeroLatency, estimatedCostJpy, feedbackType } = body;

        if (!sessionId || !spotId) {
            return NextResponse.json({ error: "Missing required analytics fields" }, { status: 400 });
        }

        const newEvent = recordAnalyticsEvent({
            sessionId,
            spotId,
            spotName: spotName || "Unknown Spot",
            language: language || "en",
            eventType: eventType || "chapter_played",
            chapterIndex: chapterIndex || 1,
            topicTitle,
            isZeroLatency: Boolean(isZeroLatency),
            estimatedCostJpy: estimatedCostJpy || 0,
            feedbackType,
        });

        return NextResponse.json({ success: true, event: newEvent });
    } catch (error: any) {
        console.error("Analytics POST Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE() {
    try {
        clearAnalyticsEvents();
        return NextResponse.json({ success: true, message: "Analytics events cleared." });
    } catch (error: any) {
        console.error("Analytics DELETE Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
