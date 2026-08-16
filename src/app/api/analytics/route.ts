import { NextRequest, NextResponse } from "next/server";
import { getAnalyticsSummary, recordAnalyticsEvent, clearAnalyticsEvents } from "@/lib/analyticsStore";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const timeRange = searchParams.get("range") || "all";
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
