"use client";

import { useState, useEffect, useRef } from "react";
import { Search, MapPin, X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SearchOverlay() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (query.length < 2) {
            setResults([]);
            return;
        }

        const timeoutId = setTimeout(async () => {
            setIsLoading(true);
            try {
                const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
                // Note: Direct client-side calls to Places Autocomplete are possible with a proxy or the Maps JS SDK.
                // For simplicity and security, we'll use a small proxy API or the Maps SDK if loaded.
                // However, for this MVP, let's use a server-side route for autocomplete to avoid exposing API keys too much.
                const response = await fetch(`/api/autocomplete?input=${encodeURIComponent(query)}`);
                const data = await response.json();
                setResults(data.predictions || []);
            } catch (error) {
                console.error("Autocomplete error:", error);
            } finally {
                setIsLoading(false);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [query]);

    const handleSelect = (placeId: string) => {
        router.push(`/spots/${placeId}`);
        setIsOpen(false);
        setQuery("");
    };

    return (
        <div className="relative w-full max-w-md mx-auto">
            <div
                onClick={() => {
                    setIsOpen(true);
                    setTimeout(() => inputRef.current?.focus(), 100);
                }}
                className="flex items-center gap-3 px-4 py-3 bg-white border border-neutral-200 rounded-2xl shadow-sm cursor-text hover:border-blue-400 transition-colors"
            >
                <Search className="w-5 h-5 text-neutral-400" />
                <span className="text-neutral-400">Where do you want to go?</span>
            </div>

            {isOpen && (
                <div className="fixed inset-0 z-[100] bg-white p-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-neutral-100 rounded-2xl">
                            <Search className="w-5 h-5 text-neutral-400" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search for a place in Japan..."
                                className="bg-transparent border-none outline-none w-full text-lg font-medium"
                            />
                            {isLoading && <Loader2 className="w-5 h-5 animate-spin text-blue-600" />}
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-3 bg-neutral-100 rounded-full hover:bg-neutral-200 transition-colors"
                        >
                            <X className="w-6 h-6 text-neutral-600" />
                        </button>
                    </div>

                    <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-140px)]">
                        {results.length > 0 ? (
                            results.map((result) => (
                                <button
                                    key={result.place_id}
                                    onClick={() => handleSelect(result.place_id)}
                                    className="w-full flex items-start gap-4 p-4 hover:bg-neutral-50 rounded-2xl transition-colors text-left border-b border-neutral-50 last:border-none"
                                >
                                    <div className="mt-1 p-2 bg-blue-50 rounded-lg">
                                        <MapPin className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-neutral-900">{result.structured_formatting.main_text}</p>
                                        <p className="text-sm text-neutral-500">{result.structured_formatting.secondary_text}</p>
                                    </div>
                                </button>
                            ))
                        ) : query.length >= 2 && !isLoading ? (
                            <p className="text-center text-neutral-400 py-12">No places found. Try another name.</p>
                        ) : (
                            <div className="py-12 text-center space-y-4">
                                <div className="p-4 bg-blue-50 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                                    <MapPin className="w-8 h-8 text-blue-600" />
                                </div>
                                <p className="text-neutral-500 font-medium">Discover stories behind any spot.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
