"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { mockSpots, Spot } from "@/data/mockSpots";
import { Headphones, Globe, Heart, Play, Loader2 } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const LANGUAGES = [
    { id: "en", label: "English" },
    { id: "ja", label: "日本語" },
    { id: "zh", label: "中文" },
    { id: "ru", label: "Русский" },
    { id: "bilingual", label: "JP & EN" },
];

const INTERESTS = [
    { id: "history", label: "History", icon: "🏛️" },
    { id: "culture", label: "Culture", icon: "🎨" },
    { id: "food", label: "Food", icon: "🍣" },
    { id: "nature", label: "Nature", icon: "🌳" },
];

export default function SpotPage() {
    const params = useParams();
    const spotId = params.id as string;

    const [spot, setSpot] = useState<Spot | null>(mockSpots[spotId] || null);
    const [isLoadingSpot, setIsLoadingSpot] = useState(!mockSpots[spotId]);
    const [selectedLanguage, setSelectedLanguage] = useState("en");
    const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!spot && spotId) {
            setIsLoadingSpot(true);
            fetch(`/api/place-details?place_id=${spotId}`)
                .then(res => res.json())
                .then(data => {
                    if (data.spot) {
                        setSpot(data.spot);
                    }
                })
                .catch(err => console.error("Error fetching spot details:", err))
                .finally(() => setIsLoadingSpot(false));
        }
    }, [spotId, spot]);

    if (isLoadingSpot) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
                <p className="text-neutral-500">Loading spot details...</p>
            </div>
        );
    }

    if (!spot) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
                <h1 className="text-2xl font-bold">Spot not found</h1>
                <p className="text-gray-500">Please check the URL or try searching again.</p>
            </div>
        );
    }

    const toggleInterest = (id: string) => {
        setSelectedInterests((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        setAudioUrl(null);

        try {
            const response = await fetch("/api/generate-audio", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    spot,
                    language: selectedLanguage,
                    interests: selectedInterests,
                }),
            });

            if (!response.ok) throw new Error("Failed to generate audio");

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            setAudioUrl(url);
        } catch (error) {
            console.error(error);
            alert("Something went wrong during generation.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <main className="max-w-2xl mx-auto pb-24">
            {/* Hero Section */}
            <div className="relative h-64 w-full">
                <img
                    src={spot.imageUrl}
                    alt={spot.name}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                    <h1 className="text-3xl font-bold leading-tight">{spot.name}</h1>
                    <p className="text-sm opacity-90 flex items-center gap-1 mt-1">
                        <span className="inline-block w-3 h-3 bg-red-500 rounded-full" />
                        {spot.location}
                    </p>
                </div>
            </div>

            <div className="p-6 space-y-8 bg-white rounded-t-3xl -mt-6 relative z-10">
                {/* Description Section */}
                <section>
                    <div className="flex items-center gap-2 mb-3 text-neutral-800">
                        <Headphones className="w-5 h-5 text-blue-600" />
                        <h2 className="text-xl font-bold">About this Spot</h2>
                    </div>
                    <p className="text-neutral-600 leading-relaxed">
                        {spot.description_base}
                    </p>
                </section>

                {/* Language Selection */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <Globe className="w-5 h-5 text-blue-600" />
                        <h2 className="text-xl font-bold">Your Language</h2>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {LANGUAGES.map((lang) => (
                            <button
                                key={lang.id}
                                onClick={() => setSelectedLanguage(lang.id)}
                                className={cn(
                                    "py-3 px-4 rounded-xl border-2 transition-all font-medium",
                                    selectedLanguage === lang.id
                                        ? "border-blue-600 bg-blue-50 text-blue-600"
                                        : "border-neutral-200 text-neutral-500"
                                )}
                            >
                                {lang.label}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Interest Selection */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <Heart className="w-5 h-5 text-pink-500" />
                        <h2 className="text-xl font-bold">Your Interests</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {INTERESTS.map((interest) => (
                            <button
                                key={interest.id}
                                onClick={() => toggleInterest(interest.id)}
                                className={cn(
                                    "py-4 px-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2",
                                    selectedInterests.includes(interest.id)
                                        ? "border-pink-500 bg-pink-50 text-pink-700"
                                        : "border-neutral-100 bg-neutral-50 text-neutral-500"
                                )}
                            >
                                <span className="text-2xl">{interest.icon}</span>
                                <span className="text-sm font-semibold">{interest.label}</span>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Action Button */}
                <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className={cn(
                        "w-full py-5 rounded-2xl font-bold text-lg shadow-lg flex items-center justify-center gap-3 transition-all active:scale-95",
                        isGenerating
                            ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                    )}
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="w-6 h-6 animate-spin" />
                            Generating your guide...
                        </>
                    ) : (
                        <>
                            <Play className="w-6 h-6 fill-current" />
                            Generate Audio Guide
                        </>
                    )}
                </button>
            </div>

            {/* Floating Audio Player */}
            {audioUrl && (
                <div className="fixed bottom-6 left-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-neutral-900 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-white/10">
                        <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                            <Headphones className="w-6 h-6" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-bold truncate">{spot.name}</p>
                            <p className="text-xs text-neutral-400">Personalized Guide</p>
                        </div>
                        <audio controls autoPlay src={audioUrl} className="h-10 w-48" />
                    </div>
                </div>
            )}
        </main>
    );
}
