"use client";

import { useState, useEffect } from "react";
import SearchOverlay from "@/components/SearchOverlay";
import UserProfileCard from "@/components/UserProfileCard";
import Link from "next/link";
import { MapPin, ArrowRight, Globe } from "lucide-react";

const LANGUAGES = [
    { id: "en", label: "English", icon: "🇺🇸" },
    { id: "ja", label: "日本語", icon: "🇯🇵" },
    { id: "zh", label: "中文", icon: "🇨🇳" },
    { id: "ru", label: "Русский", icon: "🇷🇺" },
];

const UI_STRINGS: Record<string, { subtitle: string; recommended: string; footer: string }> = {
    en: {
        subtitle: "Personalized audio stories for your Japanese journey.",
        recommended: "Recommended Spots",
        footer: "© 2024 Inbound AI Audio Guide",
    },
    ja: {
        subtitle: "あなたの感性に寄り添う、パーソナライズ音声ガイド。",
        recommended: "おすすめの観光スポット",
        footer: "© 2024 Inbound AI 音声ガイド",
    },
    zh: {
        subtitle: "为您量身定制的日本专属语音导览故事。",
        recommended: "推荐景点",
        footer: "© 2024 Inbound AI 语音导览",
    },
    ru: {
        subtitle: "Персонализированные аудиогиды по Японии для вас.",
        recommended: "Рекомендуемые места",
        footer: "© 2024 Inbound AI Аудиогид",
    },
};

const FEATURED_SPOTS_MULTILINGUAL: Record<string, Array<{ id: string; name: string; location: string; imageUrl: string }>> = {
    en: [
        {
            id: "asakusa-temple",
            name: "Senso-ji Temple (浅草寺)",
            location: "Asakusa, Tokyo",
            imageUrl: "/images/sensoji.jpg",
        },
        {
            id: "kinkaku-ji",
            name: "Kinkaku-ji (金閣寺)",
            location: "Kyoto",
            imageUrl: "/images/kinkakuji.jpg",
        },
    ],
    ja: [
        {
            id: "asakusa-temple",
            name: "浅草寺 (Senso-ji Temple)",
            location: "東京都 台東区浅草",
            imageUrl: "/images/sensoji.jpg",
        },
        {
            id: "kinkaku-ji",
            name: "金閣寺 (Kinkaku-ji)",
            location: "京都府 京都市北区",
            imageUrl: "/images/kinkakuji.jpg",
        },
    ],
    zh: [
        {
            id: "asakusa-temple",
            name: "浅草寺 (Senso-ji Temple)",
            location: "东京都 台东区浅草",
            imageUrl: "/images/sensoji.jpg",
        },
        {
            id: "kinkaku-ji",
            name: "金阁寺 (Kinkaku-ji)",
            location: "京都府 京都市",
            imageUrl: "/images/kinkakuji.jpg",
        },
    ],
    ru: [
        {
            id: "asakusa-temple",
            name: "Храм Сэнсо-дзи (浅草寺)",
            location: "Токио, Асакуса",
            imageUrl: "/images/sensoji.jpg",
        },
        {
            id: "kinkaku-ji",
            name: "Кинкаку-дзи (Золотой павильон)",
            location: "Киото",
            imageUrl: "/images/kinkakuji.jpg",
        },
    ],
};

export default function Home() {
    const [selectedLanguage, setSelectedLanguage] = useState("en");

    useEffect(() => {
        const savedLang = localStorage.getItem("ai_guide_language");
        if (savedLang && (savedLang === "en" || savedLang === "ja" || savedLang === "zh" || savedLang === "ru")) {
            setSelectedLanguage(savedLang);
        } else if (savedLang === "bilingual") {
            setSelectedLanguage("en");
            localStorage.setItem("ai_guide_language", "en");
        }
    }, []);

    const handleLanguageChange = (lang: string) => {
        setSelectedLanguage(lang);
        localStorage.setItem("ai_guide_language", lang);
    };

    const strings = UI_STRINGS[selectedLanguage] || UI_STRINGS.en;
    const spots = FEATURED_SPOTS_MULTILINGUAL[selectedLanguage] || FEATURED_SPOTS_MULTILINGUAL.en;

    return (
        <main className="min-h-screen p-6 max-w-2xl mx-auto">
            {/* Language Selector Bar (4 Languages: en, ja, zh, ru) */}
            <div className="flex items-center justify-center pt-2 pb-2">
                <div className="flex items-center gap-1.5 p-1 bg-neutral-100/90 border border-neutral-200/80 rounded-full shadow-2xs">
                    <div className="px-2 text-neutral-400">
                        <Globe className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    {LANGUAGES.map((l) => (
                        <button
                            key={l.id}
                            onClick={() => handleLanguageChange(l.id)}
                            className={`px-3.5 py-1 rounded-full text-xs font-bold transition-all ${
                                selectedLanguage === l.id
                                    ? "bg-blue-600 text-white shadow-xs"
                                    : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60"
                            }`}
                        >
                            <span className="mr-1">{l.icon}</span>
                            {l.label}
                        </button>
                    ))}
                </div>
            </div>

            <header className="py-6 text-center">
                <h1 className="text-4xl font-extrabold text-neutral-900 tracking-tight">
                    Inbound <span className="text-blue-600">AI Guide</span>
                </h1>
                <p className="mt-3 text-neutral-500 font-medium">
                    {strings.subtitle}
                </p>
            </header>

            {/* Reactive Search Bar with language prop */}
            <div className="mb-6">
                <SearchOverlay language={selectedLanguage} />
            </div>

            {/* Reactive User Profile Card with language prop */}
            <UserProfileCard language={selectedLanguage} />

            {/* Recommended Spots */}
            <div className="space-y-6">
                <h2 className="text-xl font-bold text-neutral-800">{strings.recommended}</h2>
                {spots.map((spot) => (
                    <Link
                        key={spot.id}
                        href={`/spots/${spot.id}`}
                        className="group block relative h-48 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all"
                    >
                        <img
                            src={spot.imageUrl}
                            alt={spot.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between text-white">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest opacity-80 flex items-center gap-1 mb-1">
                                    <MapPin className="w-3 h-3" />
                                    {spot.location}
                                </p>
                                <h3 className="text-xl font-bold">{spot.name}</h3>
                            </div>
                            <div className="bg-white/20 backdrop-blur-md p-2 rounded-full group-hover:bg-blue-600 transition-colors">
                                <ArrowRight className="w-5 h-5" />
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            <footer className="mt-24 py-8 border-t border-neutral-200 text-center text-neutral-400 text-sm">
                <p>{strings.footer}</p>
            </footer>
        </main>
    );
}
