import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const input = searchParams.get("input");

    if (!input) {
        return NextResponse.json({ predictions: [] });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: "Google Maps API key not configured" }, { status: 500 });
    }

    try {
        // Restrict to Japan (components=country:jp) for better relevance as per the app's context
        const response = await fetch(
            `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${apiKey}&language=ja&components=country:jp`
        );

        const data = await response.json();

        return NextResponse.json(data);
    } catch (error: any) {
        console.error("Autocomplete Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
