import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const placeId = searchParams.get("place_id");

    if (!placeId) {
        return NextResponse.json({ error: "Missing place_id" }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: "Google Maps API key not configured" }, { status: 500 });
    }

    try {
        const response = await fetch(
            `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,photos,editorial_summary,types&key=${apiKey}&language=ja`
        );

        const data = await response.json();

        if (data.status !== "OK") {
            throw new Error(data.error_message || "Failed to fetch place details");
        }

        const result = data.result;
        
        // Construct a structured response
        const spot = {
            id: placeId,
            name: result.name,
            location: result.formatted_address,
            description_base: result.editorial_summary?.overview || "No description available.",
            imageUrl: result.photos && result.photos.length > 0
                ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${result.photos[0].photo_reference}&key=${apiKey}`
                : "https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&q=80&w=1000", // Default Japan image
        };

        return NextResponse.json({ spot });
    } catch (error: any) {
        console.error("Place Details Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
