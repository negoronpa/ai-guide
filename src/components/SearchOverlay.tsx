"use client";

import { useState, useEffect, useRef } from "react";
import { Search, MapPin, X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface SearchOverlayProps {
    language?: string;
}

export default function SearchOverlay({ language = "en" }: SearchOverlayProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [currentLanguage, setCurrentLanguage] = useState(language);
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (language) {
            setCurrentLanguage(language);
        } else {
            const saved = localStorage.getItem("ai_guide_language");
            if (saved) setCurrentLanguage(saved);
        }
    }, [language]);

    const placeholders: Record<string, string> = {
        en: "Where do you want to go?",
        ja: "どこへ行きたいですか？（例: 厳島神社, 清水寺）",
        zh: "您想去哪里探索？（例如：严岛神社、清水寺）",
        ru: "Куда вы хотите отправиться? (напр. Ицукусима)",
    };

    const placeholderText = placeholders[currentLanguage] || placeholders.en;

    useEffect(() => {
        if (query.length < 2) {
            setResults([]);
            return;
        }

        const timeoutId = setTimeout(async () => {
            setIsLoading(true);
            try {
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
                <span className="text-neutral-400 text-sm">{placeholderText}</span>
            </div>

            {isOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 p-4 flex flex-col items-center">
                    <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden mt-12 animate-in fade-in zoom-in-95 duration-200">
                        {/* Search Input Bar */}
                        <div className="p-4 border-b border-neutral-100 flex items-center gap-3">
                            <Search className="w-5 h-5 text-blue-600 flex-shrink-0" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder={placeholderText}
                                className="w-full text-base font-medium text-neutral-800 placeholder-neutral-400 focus:outline-none"
                            />
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
                            ) : query ? (
                                <button
                                    onClick={() => setQuery("")}
                                    className="p-1 hover:bg-neutral-100 rounded-full text-neutral-400"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            ) : null}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="px-3 py-1.5 text-xs font-bold text-neutral-600 hover:bg-neutral-100 rounded-xl"
                            >
                                {currentLanguage === "ja" ? "閉じる" : currentLanguage === "zh" ? "关闭" : currentLanguage === "ru" ? "Закрыть" : "Close"}
                            </button>
                        </div>

                        {/* Search Results List */}
                        <div className="max-h-80 overflow-y-auto p-2">
                            {results.length > 0 ? (
                                <div className="space-y-1">
                                    {results.map((item) => (
                                        <button
                                            key={item.place_id}
                                            onClick={() => handleSelect(item.place_id)}
                                            className="w-full p-3 rounded-2xl flex items-start gap-3 text-left hover:bg-blue-50/60 transition-colors group"
                                        >
                                            <div className="p-2 bg-neutral-100 group-hover:bg-blue-100 text-neutral-500 group-hover:text-blue-600 rounded-xl mt-0.5">
                                                <MapPin className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-neutral-900 truncate">
                                                    {item.structured_formatting?.main_text || item.description}
                                                </p>
                                                <p className="text-xs text-neutral-500 truncate">
                                                    {item.structured_formatting?.secondary_text || ""}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : query.length >= 2 && !isLoading ? (
                                <div className="p-8 text-center text-neutral-400 text-sm">
                                    {currentLanguage === "ja" ? "該当する観光地が見つかりませんでした" : "No destinations found"}
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
