"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { mockSpots, Spot } from "@/data/mockSpots";
import {
    Headphones,
    Globe,
    Heart,
    Play,
    Loader2,
    Sparkles,
    Volume2,
    FileText,
    ArrowRight,
    MessageCircleQuestion,
    Send,
    RotateCcw,
    Compass,
    ExternalLink,
    BookOpen
} from "lucide-react";
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

interface GuideChapter {
    id: string;
    title: string;
    icon: string;
    script: string;
    audioUrl: string;
    sources?: Array<{ title: string; url: string }>;
}

interface NextTopic {
    id: string;
    icon: string;
    title: string;
    prompt: string;
}

export default function SpotPage() {
    const params = useParams();
    const spotId = params.id as string;

    const [spot, setSpot] = useState<Spot | null>(mockSpots[spotId] || null);
    const [isLoadingSpot, setIsLoadingSpot] = useState(!mockSpots[spotId]);
    const [selectedLanguage, setSelectedLanguage] = useState("en");
    const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
    const [userProfile, setUserProfile] = useState<string>("");
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    
    // Multi-stage states
    const [chapters, setChapters] = useState<GuideChapter[]>([]);
    const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
    const [nextTopics, setNextTopics] = useState<NextTopic[]>([]);
    const [customQuestion, setCustomQuestion] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatingMessage, setGeneratingMessage] = useState("AIが音声を高速生成中...");
    const [audioUrl, setAudioUrl] = useState<string | null>(null);

    const timelineEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const savedProfile = localStorage.getItem("ai_audio_guide_user_profile");
        if (savedProfile) {
            setUserProfile(savedProfile);
        }
    }, []);

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
                <p className="text-neutral-500 font-medium">Loading spot details...</p>
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

    const handleProfileChange = (val: string) => {
        setUserProfile(val);
        localStorage.setItem("ai_audio_guide_user_profile", val);
    };

    const executeGenerate = async (topicTitle: string, topicPrompt: string = "", icon: string = "✨") => {
        setIsGenerating(true);
        setGeneratingMessage(topicPrompt ? `「${topicTitle}」を深掘り生成中...` : "パーソナライズ音声を生成中...");

        try {
            const response = await fetch("/api/generate-audio", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    spot,
                    language: selectedLanguage,
                    interests: selectedInterests,
                    userProfile: userProfile.trim(),
                    currentTopic: topicPrompt || "",
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || "Failed to generate audio");
            }

            // Extract script, nextTopics, and sources
            const scriptHeader = response.headers.get("x-script-text");
            const topicsHeader = response.headers.get("x-next-topics");
            const sourcesHeader = response.headers.get("x-sources");

            let scriptText = "";
            if (scriptHeader) {
                try {
                    scriptText = decodeURIComponent(scriptHeader);
                } catch {
                    scriptText = scriptHeader;
                }
            }

            // Client-side safety fallback: If raw JSON was passed, extract the script property
            if (scriptText.trim().startsWith("{") && scriptText.includes('"script"')) {
                try {
                    const parsed = JSON.parse(scriptText);
                    if (parsed.script) {
                        scriptText = parsed.script;
                    }
                } catch {
                    const match = scriptText.match(/"script"\s*:\s*"((?:\\.|[^"\\])*)"/);
                    if (match) {
                        scriptText = match[1].replace(/\\n/g, "\n").replace(/\\"/g, '"');
                    }
                }
            }

            if (topicsHeader) {
                try {
                    const parsedTopics = JSON.parse(decodeURIComponent(topicsHeader));
                    if (Array.isArray(parsedTopics)) {
                        setNextTopics(parsedTopics);
                    }
                } catch (e) {
                    console.warn("Error parsing next topics header:", e);
                }
            }

            let chapterSources: Array<{ title: string; url: string }> = [];
            if (sourcesHeader) {
                try {
                    const parsedSources = JSON.parse(decodeURIComponent(sourcesHeader));
                    if (Array.isArray(parsedSources)) {
                        chapterSources = parsedSources;
                    }
                } catch (e) {
                    console.warn("Error parsing sources header:", e);
                }
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            setAudioUrl(url);

            const newChapter: GuideChapter = {
                id: `chapter-${Date.now()}`,
                title: topicTitle,
                icon: icon,
                script: scriptText,
                audioUrl: url,
                sources: chapterSources,
            };

            setChapters((prev) => [...prev, newChapter]);
            setActiveChapterId(newChapter.id);

            setTimeout(() => {
                timelineEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 300);
        } catch (error: any) {
            console.error(error);
            alert(error.message || "Something went wrong during generation.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCustomQuestionSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!customQuestion.trim() || isGenerating) return;
        const q = customQuestion.trim();
        setCustomQuestion("");
        executeGenerate(`質問: ${q.slice(0, 15)}${q.length > 15 ? "..." : ""}`, q, "💬");
    };

    const playChapter = (chapter: GuideChapter) => {
        setAudioUrl(chapter.audioUrl);
        setActiveChapterId(chapter.id);
    };

    return (
        <main className="max-w-2xl mx-auto pb-40">
            {/* Hero Section */}
            <div className="relative h-64 w-full">
                <img
                    src={spot.imageUrl}
                    alt={spot.name}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                    <h1 className="text-3xl font-bold leading-tight drop-shadow">{spot.name}</h1>
                    <p className="text-sm opacity-90 flex items-center gap-1 mt-1 font-medium">
                        <span className="inline-block w-2.5 h-2.5 bg-red-500 rounded-full" />
                        {spot.location}
                    </p>
                </div>
            </div>

            <div className="p-6 space-y-6 bg-white rounded-t-3xl -mt-6 relative z-10">
                {/* Description Section */}
                <section>
                    <div className="flex items-center gap-2 mb-2 text-neutral-800">
                        <Headphones className="w-5 h-5 text-blue-600" />
                        <h2 className="text-lg font-bold">About this Spot</h2>
                    </div>
                    <p className="text-neutral-600 text-sm leading-relaxed">
                        {spot.description_base}
                    </p>
                </section>

                {/* User Travel Persona / Profile Section */}
                <section className="bg-blue-50/70 p-4 rounded-2xl border border-blue-100">
                    <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-blue-600" />
                            <h3 className="text-sm font-bold text-blue-900">
                                あなたの旅行スタイル・属性（パーソナライズ）
                            </h3>
                        </div>
                        <button
                            onClick={() => setIsEditingProfile(!isEditingProfile)}
                            className="text-xs font-bold text-blue-600 hover:text-blue-800"
                        >
                            {isEditingProfile ? "保存" : "編集"}
                        </button>
                    </div>

                    {isEditingProfile ? (
                        <textarea
                            value={userProfile}
                            onChange={(e) => handleProfileChange(e.target.value)}
                            placeholder="例: アニメ好きの一人旅 / 小学生連れの家族旅行 / 建築と歴史重視..."
                            rows={2}
                            className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none mt-1"
                        />
                    ) : (
                        <p className="text-xs text-blue-800 leading-relaxed font-medium">
                            {userProfile ? userProfile : "未設定（TOP画面または右上の「編集」から設定できます）"}
                        </p>
                    )}
                </section>

                {/* Preferences (Language & Interests) - Collapsible or compact */}
                {chapters.length === 0 && (
                    <div className="space-y-6 pt-2">
                        {/* Language Selection */}
                        <section>
                            <div className="flex items-center gap-2 mb-3">
                                <Globe className="w-5 h-5 text-blue-600" />
                                <h2 className="text-base font-bold text-neutral-800">Your Language</h2>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {LANGUAGES.map((lang) => (
                                    <button
                                        key={lang.id}
                                        onClick={() => setSelectedLanguage(lang.id)}
                                        className={cn(
                                            "py-2.5 px-3 rounded-xl border-2 transition-all font-medium text-xs",
                                            selectedLanguage === lang.id
                                                ? "border-blue-600 bg-blue-50 text-blue-600 font-bold shadow-sm"
                                                : "border-neutral-200 text-neutral-500 hover:border-neutral-300"
                                        )}
                                    >
                                        {lang.label}
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* Interest Selection */}
                        <section>
                            <div className="flex items-center gap-2 mb-3">
                                <Heart className="w-5 h-5 text-pink-500" />
                                <h2 className="text-base font-bold text-neutral-800">Your Interests</h2>
                            </div>
                            <div className="grid grid-cols-2 gap-2.5">
                                {INTERESTS.map((interest) => (
                                    <button
                                        key={interest.id}
                                        onClick={() => toggleInterest(interest.id)}
                                        className={cn(
                                            "py-3 px-3 rounded-xl border-2 transition-all flex items-center gap-2.5",
                                            selectedInterests.includes(interest.id)
                                                ? "border-pink-500 bg-pink-50 text-pink-700 font-bold shadow-sm"
                                                : "border-neutral-100 bg-neutral-50 text-neutral-500 hover:bg-neutral-100"
                                        )}
                                    >
                                        <span className="text-xl">{interest.icon}</span>
                                        <span className="text-xs font-semibold">{interest.label}</span>
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* Initial Start Button */}
                        <button
                            onClick={() => executeGenerate("ハイライトガイド", "", "✨")}
                            disabled={isGenerating}
                            className={cn(
                                "w-full py-4 rounded-2xl font-bold text-base shadow-lg flex items-center justify-center gap-3 transition-all active:scale-98",
                                isGenerating
                                    ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                                    : "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20"
                            )}
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                                    <span className="text-neutral-700 text-sm">{generatingMessage}</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5" />
                                    ガイドを再生する (Start Audio Guide)
                                </>
                            )}
                        </button>
                    </div>
                )}

                {/* Multi-Stage Story Timeline */}
                {chapters.length > 0 && (
                    <div className="space-y-6 pt-4 border-t border-neutral-100">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Compass className="w-5 h-5 text-blue-600" />
                                <h3 className="text-base font-bold text-neutral-900">
                                    ストーリータイムライン ({chapters.length}チャプター)
                                </h3>
                            </div>
                        </div>

                        {/* Chapters Cards */}
                        <div className="space-y-4">
                            {chapters.map((chapter, idx) => {
                                const isActive = activeChapterId === chapter.id;
                                return (
                                    <div
                                        key={chapter.id}
                                        className={cn(
                                            "p-4 rounded-2xl border transition-all duration-300",
                                            isActive
                                                ? "bg-blue-50/40 border-blue-400 shadow-sm"
                                                : "bg-neutral-50/60 border-neutral-200/80"
                                        )}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">{chapter.icon}</span>
                                                <span className="text-xs font-bold text-neutral-500 uppercase">
                                                    Chapter {idx + 1}
                                                </span>
                                                <h4 className="text-sm font-bold text-neutral-900">
                                                    {chapter.title}
                                                </h4>
                                            </div>
                                            <button
                                                onClick={() => playChapter(chapter)}
                                                className={cn(
                                                    "px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all",
                                                    isActive
                                                        ? "bg-blue-600 text-white shadow"
                                                        : "bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-100"
                                                )}
                                            >
                                                {isActive ? (
                                                    <>
                                                        <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                                                        再生中
                                                    </>
                                                ) : (
                                                    <>
                                                        <Play className="w-3.5 h-3.5 fill-current" />
                                                        再生
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                        <p className="text-xs text-neutral-700 leading-relaxed whitespace-pre-line pl-7">
                                            {chapter.script}
                                        </p>

                                        {/* Sources & References */}
                                        {chapter.sources && chapter.sources.length > 0 && (
                                            <div className="mt-3 pt-3 border-t border-neutral-200/60 pl-7">
                                                <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                                    <BookOpen className="w-3 h-3 text-blue-500" />
                                                    参照元・公式情報 (Sources):
                                                </p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {chapter.sources.map((src, sIdx) => (
                                                        <a
                                                            key={sIdx}
                                                            href={src.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-blue-50 border border-neutral-200 hover:border-blue-300 rounded-lg text-xs text-blue-600 font-medium transition-all shadow-2xs hover:shadow-xs group"
                                                        >
                                                            <span className="truncate max-w-[220px]">{src.title}</span>
                                                            <ExternalLink className="w-3 h-3 text-neutral-400 group-hover:text-blue-600 flex-shrink-0" />
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Next Topics / 3 Choices Section */}
                        {nextTopics.length > 0 && !isGenerating && (
                            <div className="pt-4 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="flex items-center gap-2 text-neutral-800">
                                    <Sparkles className="w-4 h-4 text-amber-500" />
                                    <h4 className="text-sm font-bold">
                                        次に何を聞きたいですか？（深掘りテーマ）
                                    </h4>
                                </div>

                                <div className="grid grid-cols-1 gap-2.5">
                                    {nextTopics.map((topic) => (
                                        <button
                                            key={topic.id}
                                            onClick={() => executeGenerate(topic.title, topic.prompt, topic.icon)}
                                            disabled={isGenerating}
                                            className="group w-full p-3.5 bg-gradient-to-r from-neutral-50 to-blue-50/30 hover:from-blue-50 hover:to-blue-100/50 border border-neutral-200 hover:border-blue-300 rounded-2xl flex items-center justify-between text-left transition-all active:scale-98 shadow-sm hover:shadow"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl p-1.5 bg-white rounded-xl shadow-xs">
                                                    {topic.icon}
                                                </span>
                                                <div>
                                                    <p className="text-sm font-bold text-neutral-900 group-hover:text-blue-700 transition-colors">
                                                        {topic.title}
                                                    </p>
                                                    <p className="text-xs text-neutral-500 line-clamp-1 mt-0.5">
                                                        {topic.prompt}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="p-2 bg-white rounded-full text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors flex-shrink-0">
                                                <ArrowRight className="w-4 h-4" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Generating Indicator */}
                        {isGenerating && (
                            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200 flex items-center justify-center gap-3 animate-pulse">
                                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                                <span className="text-sm font-bold text-blue-800">{generatingMessage}</span>
                            </div>
                        )}

                        {/* Free Question / Ask AI Form */}
                        <div className="pt-2 border-t border-neutral-100">
                            <form onSubmit={handleCustomQuestionSubmit} className="relative flex items-center">
                                <div className="absolute left-3.5 text-neutral-400">
                                    <MessageCircleQuestion className="w-4 h-4 text-blue-600" />
                                </div>
                                <input
                                    type="text"
                                    value={customQuestion}
                                    onChange={(e) => setCustomQuestion(e.target.value)}
                                    placeholder="他に聞きたいことはありますか？（例: 近くの穴場カフェは？）"
                                    disabled={isGenerating}
                                    className="w-full pl-10 pr-12 py-3 bg-neutral-100 border border-transparent focus:border-blue-400 focus:bg-white rounded-2xl text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none transition-all"
                                />
                                <button
                                    type="submit"
                                    disabled={!customQuestion.trim() || isGenerating}
                                    className="absolute right-2 p-2 bg-blue-600 text-white rounded-xl disabled:bg-neutral-300 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
                                >
                                    <Send className="w-3.5 h-3.5" />
                                </button>
                            </form>
                        </div>

                        <div ref={timelineEndRef} />
                    </div>
                )}
            </div>

            {/* Floating Audio Player */}
            {audioUrl && (
                <div className="fixed bottom-6 left-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-neutral-900 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-white/10">
                        <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Volume2 className="w-6 h-6 animate-pulse" />
                        </div>
                        <div className="flex-1 overflow-hidden min-w-0">
                            <p className="text-sm font-bold truncate">{spot.name}</p>
                            <p className="text-xs text-neutral-400">Interactive Audio Story</p>
                        </div>
                        <audio controls autoPlay src={audioUrl} className="h-10 w-48 flex-shrink-0" />
                    </div>
                </div>
            )}
        </main>
    );
}

