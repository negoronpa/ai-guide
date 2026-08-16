"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
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
    ArrowLeft,
    MessageCircleQuestion,
    Send,
    RotateCcw,
    Compass,
    ExternalLink,
    BookOpen,
    Zap,
    AlertCircle,
    ThumbsUp,
    ThumbsDown,
    Check
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface InterestOption {
    id: string;
    label: string;
    icon: string;
}

const INTERESTS_MAP: Record<string, InterestOption[]> = {
    en: [
        { id: "history", label: "History", icon: "🏛️" },
        { id: "culture", label: "Culture", icon: "🎨" },
        { id: "food", label: "Food & Snacks", icon: "🍣" },
        { id: "nature", label: "Nature & Views", icon: "🌳" },
    ],
    ja: [
        { id: "history", label: "歴史・起源", icon: "🏛️" },
        { id: "culture", label: "文化・芸術", icon: "🎨" },
        { id: "food", label: "グルメ・名物", icon: "🍣" },
        { id: "nature", label: "自然・景観", icon: "🌳" },
    ],
    zh: [
        { id: "history", label: "历史背景", icon: "🏛️" },
        { id: "culture", label: "文化艺术", icon: "🎨" },
        { id: "food", label: "特色美食", icon: "🍣" },
        { id: "nature", label: "自然风光", icon: "🌳" },
    ],
    ru: [
        { id: "history", label: "История", icon: "🏛️" },
        { id: "culture", label: "Культура", icon: "🎨" },
        { id: "food", label: "Еда и кухня", icon: "🍣" },
        { id: "nature", label: "Природа", icon: "🌳" },
    ],
};

const SPOT_UI_STRINGS: Record<string, any> = {
    en: {
        back: "Back to Spots",
        aboutSpot: "About this Spot",
        profileTitle: "Traveler Persona (Personalization)",
        edit: "Edit",
        save: "Save",
        noProfile: "Not set (Can be edited anytime)",
        profilePlaceholder: "e.g. Traveling with kids. Loves anime / Solo trip interested in architecture...",
        interestsTitle: "Your Interests",
        generateBtn: "Start Personalized Audio Story",
        generating: "Generating your audio story...",
        chapterPlaying: "Playing",
        chapterPlay: "Play",
        sources: "Sources & References:",
        helpfulQ: "Was this story helpful?",
        helpfulGood: "Good",
        nextTopicsTitle: "What would you like to explore next?",
        instantPlay: "Instant Play",
        askPlaceholder: "Ask anything else... (e.g. Any nearby hidden cafes?)",
        feedbackQ: "Did you gain new insights or inspiration today?",
        feedbackDiscovery: "💡 New Discoveries!",
        feedbackRespect: "✨ Deeply Touched by Heritage!",
        feedbackDifficult: "🤔 A bit too difficult",
        feedbackThanks: "Thank you for your feedback! We'll use it to improve future guides.",
        retry: "Try Again",
        retryHint: "Please check your network and try again",
        defaultTopic: "Highlight Guide",
    },
    ja: {
        back: "スポット一覧へ戻る",
        aboutSpot: "スポットについて",
        profileTitle: "あなたの旅行スタイル・属性（パーソナライズ）",
        edit: "編集",
        save: "保存",
        noProfile: "未設定（TOP画面または右上の「編集」から設定できます）",
        profilePlaceholder: "例: アニメ好きの一人旅 / 小学生連れの家族旅行 / 建築と歴史重視...",
        interestsTitle: "あなたの興味・関心",
        generateBtn: "✨ ガイドを再生する (Start Audio Guide)",
        generating: "AIが音声を高速生成中...",
        chapterPlaying: "再生中",
        chapterPlay: "再生",
        sources: "参照元・公式情報 (Sources):",
        helpfulQ: "この解説は役に立ちましたか？",
        helpfulGood: "Good",
        nextTopicsTitle: "次に何を聞きたいですか？（深掘りテーマ）",
        instantPlay: "即時再生",
        askPlaceholder: "他に聞きたいことはありますか？（例: 近くの穴場カフェは？）",
        feedbackQ: "今日の音声ガイドで、新しい発見や学びは得られましたか？",
        feedbackDiscovery: "💡 新しい発見があった！",
        feedbackRespect: "✨ 深い歴史に感動した！",
        feedbackDifficult: "🤔 ちょっと難しかった",
        feedbackThanks: "フィードバックありがとうございます！より良いガイド作りに役立てます。",
        retry: "もう一度試す",
        retryHint: "通信状態を確認して再試行してください",
        defaultTopic: "ハイライトガイド",
    },
    zh: {
        back: "返回景点列表",
        aboutSpot: "关于本景点",
        profileTitle: "旅行者偏好（个性化定制）",
        edit: "编辑",
        save: "保存",
        noProfile: "未设定（可在首页或右上角点击“编辑”设定）",
        profilePlaceholder: "例如：喜欢动漫的独自旅行 / 带小学生的家庭出行 / 偏好历史建筑...",
        interestsTitle: "您的兴趣偏好",
        generateBtn: "✨ 生成专属语音导览",
        generating: "AI正在高速生成语音...",
        chapterPlaying: "播放中",
        chapterPlay: "播放",
        sources: "参考来源与官方信息：",
        helpfulQ: "这段讲解对您有帮助吗？",
        helpfulGood: "好评",
        nextTopicsTitle: "接下来想深入了解什么？（深度探索主题）",
        instantPlay: "即时播放",
        askPlaceholder: "还想了解什么？（例如：附近有特色咖啡馆吗？）",
        feedbackQ: "今天的语音导览让您有所收获或感悟吗？",
        feedbackDiscovery: "💡 发现了新知识！",
        feedbackRespect: "✨ 被历史与匠心深深打动！",
        feedbackDifficult: "🤔 有点难懂",
        feedbackThanks: "感谢您的反馈！我们将持续优化导览体验。",
        retry: "重试",
        retryHint: "请检查网络连接后重试",
        defaultTopic: "亮点导览",
    },
    ru: {
        back: "Назад к местам",
        aboutSpot: "О месте",
        profileTitle: "Профиль путешественника (Персонализация)",
        edit: "Изм.",
        save: "Сохр.",
        noProfile: "Не задан (можно настроить в профиле)",
        profilePlaceholder: "Например: Семья с детьми / Любитель аниме / Интерес к архитектуре...",
        interestsTitle: "Ваши интересы",
        generateBtn: "✨ Создать аудиогид",
        generating: "ИИ генерирует аудиоисторию...",
        chapterPlaying: "Играет",
        chapterPlay: "Слушать",
        sources: "Источники и ссылки:",
        helpfulQ: "Была ли эта история полезной?",
        helpfulGood: "Полезно",
        nextTopicsTitle: "О чем хотите узнать подробнее?",
        instantPlay: "Мгновенно",
        askPlaceholder: "Хотите спросить что-то еще? (например: уютные кафе рядом?)",
        feedbackQ: "Узнали ли вы что-то новое сегодня?",
        feedbackDiscovery: "💡 Новые открытия!",
        feedbackRespect: "✨ Впечатлен историей!",
        feedbackDifficult: "🤔 Сложновато",
        feedbackThanks: "Спасибо за ваш отзыв! Мы используем его для улучшения гидов.",
        retry: "Повторить",
        retryHint: "Проверьте соединение и попробуйте снова",
        defaultTopic: "Главный гид",
    },
};

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

interface PrefetchedTopicData {
    scriptText: string;
    audioUrl: string;
    nextTopics: NextTopic[];
    sources: Array<{ title: string; url: string }>;
    status: "ready" | "loading" | "error";
}

function sanitizeTopic(t: any, idx: number): NextTopic {
    if (!t) {
        return { id: `topic-${idx}-${Date.now()}`, icon: "✨", title: `トピック ${idx + 1}`, prompt: `トピック ${idx + 1}` };
    }
    if (typeof t === "string") {
        return { id: `topic-${idx}-${Date.now()}`, icon: "✨", title: t, prompt: t };
    }
    const title = (t.title || t.name || t.topic || `トピック ${idx + 1}`).toString();
    const prompt = (t.prompt || t.question || title).toString();
    const icon = (t.icon || "✨").toString();
    const id = (t.id || `topic-${idx}-${Date.now()}`).toString();
    return { id, icon, title, prompt };
}

function sanitizeTopicList(rawList: any[]): NextTopic[] {
    if (!Array.isArray(rawList)) return [];
    const unique: NextTopic[] = [];
    const seen = new Set<string>();
    rawList.forEach((raw, idx) => {
        const item = sanitizeTopic(raw, idx);
        const key = (item.title || item.prompt || "").trim();
        if (key && !seen.has(key)) {
            seen.add(key);
            unique.push(item);
        }
    });
    return unique.slice(0, 3);
}

function cleanClientScript(text: string): string {
    let cleaned = text.trim();
    cleaned = cleaned.replace(/^(?:\*\*|\#\#\#|\s)*(?:displayScript|spokenScript|script)(?:\*\*|\s)*:\s*["']?/i, "");
    cleaned = cleaned.split(/(?:\n\s*(?:\*\*|\#\#\#|\s)*(?:spokenScript|nextTopics|sources)(?:\*\*|\s)*:)/i)[0];
    cleaned = cleaned.replace(/^["']|["']$/g, "").trim();
    return cleaned;
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
    const [generationError, setGenerationError] = useState<string | null>(null);
    const [lastFailedAction, setLastFailedAction] = useState<{ title: string; prompt: string; icon: string } | null>(null);

    // Subjective Feedback States
    const [chapterFeedbacks, setChapterFeedbacks] = useState<Record<string, "good" | "bad">>({});
    const [overallFeedback, setOverallFeedback] = useState<"discovery" | "respect" | "needs_improvement" | null>(null);

    // Speculative Prefetch Cache & Controllers
    const [prefetchCache, setPrefetchCache] = useState<Record<string, PrefetchedTopicData>>({});
    const prefetchAbortControllers = useRef<AbortController[]>([]);
    const prefetchTimerRef = useRef<NodeJS.Timeout | null>(null);
    const timelineEndRef = useRef<HTMLDivElement>(null);
    const sessionIdRef = useRef<string>(`session-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`);

    const trackEvent = (eventType: string, chapterIndex: number, topicTitle?: string, isZeroLatency?: boolean, feedbackType?: string) => {
        if (!spot) return;
        fetch("/api/analytics", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                sessionId: sessionIdRef.current,
                spotId: spot.id,
                spotName: spot.name,
                language: selectedLanguage,
                eventType,
                chapterIndex,
                topicTitle,
                isZeroLatency: Boolean(isZeroLatency),
                estimatedCostJpy: isZeroLatency ? 1.10 : 0,
                feedbackType,
            }),
        }).catch((e) => console.warn("Analytics beacon error:", e));
    };

    const handleChapterFeedback = (chapterId: string, chapterIndex: number, chapterTitle: string, type: "good" | "bad") => {
        setChapterFeedbacks((prev) => ({ ...prev, [chapterId]: type }));
        trackEvent("chapter_feedback", chapterIndex, chapterTitle, false, type);
    };

    const handleOverallFeedback = (type: "discovery" | "respect" | "needs_improvement") => {
        setOverallFeedback(type);
        trackEvent("overall_feedback", chapters.length, "スポット全体の学び", false, type);
    };

    useEffect(() => {
        const savedProfile = localStorage.getItem("ai_audio_guide_user_profile");
        if (savedProfile) {
            setUserProfile(savedProfile);
        }
        const savedLang = localStorage.getItem("ai_guide_language");
        if (savedLang) {
            setSelectedLanguage(savedLang);
        }
    }, []);

    const handleLanguageSelect = (langId: string) => {
        setSelectedLanguage(langId);
        localStorage.setItem("ai_guide_language", langId);
    };

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

    // Delayed Speculative Prefetch Trigger (Approach ③: Starts 4.5s after audio begins playing)
    useEffect(() => {
        // Clear previous timers and active prefetch requests
        if (prefetchTimerRef.current) {
            clearTimeout(prefetchTimerRef.current);
        }
        prefetchAbortControllers.current.forEach((controller) => controller.abort());
        prefetchAbortControllers.current = [];

        if (!audioUrl || nextTopics.length === 0 || !spot) {
            return;
        }

        console.log("Scheduling delayed speculative prefetch in 4.5 seconds for", nextTopics.length, "topics...");

        prefetchTimerRef.current = setTimeout(() => {
            console.log("Triggering background speculative prefetch for 3 next topics...");

            nextTopics.forEach((rawTopic, idx) => {
                const topic = sanitizeTopic(rawTopic, idx);
                const cacheKey = (topic.prompt || topic.title || "").trim();
                if (!cacheKey || prefetchCache[cacheKey]?.status === "ready") {
                    return;
                }

                const controller = new AbortController();
                prefetchAbortControllers.current.push(controller);

                setPrefetchCache((prev) => ({
                    ...prev,
                    [cacheKey]: {
                        scriptText: "",
                        audioUrl: "",
                        nextTopics: [],
                        sources: [],
                        status: "loading",
                    },
                }));

                fetch("/api/generate-audio", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    signal: controller.signal,
                    body: JSON.stringify({
                        spot,
                        language: selectedLanguage,
                        interests: selectedInterests,
                        userProfile: userProfile.trim(),
                        currentTopic: topic.prompt,
                    }),
                })
                    .then(async (res) => {
                        if (!res.ok) throw new Error("Prefetch failed");

                        const scriptHeader = res.headers.get("x-script-text");
                        const topicsHeader = res.headers.get("x-next-topics");
                        const sourcesHeader = res.headers.get("x-sources");

                        let scriptText = "";
                        if (scriptHeader) {
                            try {
                                scriptText = decodeURIComponent(scriptHeader);
                            } catch {
                                scriptText = scriptHeader;
                            }
                        }
                        scriptText = cleanClientScript(scriptText);

                        let parsedNextTopics: NextTopic[] = [];
                        if (topicsHeader) {
                            try {
                                const parsed = JSON.parse(decodeURIComponent(topicsHeader));
                                if (Array.isArray(parsed)) {
                                    parsedNextTopics = sanitizeTopicList(parsed);
                                }
                            } catch (e) {
                                console.warn("Prefetch topics parse warning:", e);
                            }
                        }

                        let parsedSources: Array<{ title: string; url: string }> = [];
                        if (sourcesHeader) {
                            try {
                                const parsed = JSON.parse(decodeURIComponent(sourcesHeader));
                                if (Array.isArray(parsed)) parsedSources = parsed;
                            } catch (e) {
                                console.warn("Prefetch sources parse warning:", e);
                            }
                        }

                        const blob = await res.blob();
                        const prefetchedAudioUrl = URL.createObjectURL(blob);

                        setPrefetchCache((prev) => ({
                            ...prev,
                            [cacheKey]: {
                                scriptText,
                                audioUrl: prefetchedAudioUrl,
                                nextTopics: parsedNextTopics,
                                sources: parsedSources,
                                status: "ready",
                            },
                        }));
                        console.log(`⚡ Prefetched ready for topic: "${topic.title}"`);
                    })
                    .catch((err) => {
                        if (err.name !== "AbortError") {
                            console.warn("Prefetch error for topic", topic.title, err);
                            setPrefetchCache((prev) => ({
                                ...prev,
                                [cacheKey]: {
                                    scriptText: "",
                                    audioUrl: "",
                                    nextTopics: [],
                                    sources: [],
                                    status: "error",
                                },
                            }));
                        }
                    });
            });
        }, 4500);

        return () => {
            if (prefetchTimerRef.current) {
                clearTimeout(prefetchTimerRef.current);
            }
        };
    }, [audioUrl, nextTopics, spot, selectedLanguage, selectedInterests, userProfile]);

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
        const cacheKey = topicPrompt.trim();
        const cachedItem = prefetchCache[cacheKey];

        // 🚀 FAST PATH: Instant Playback if prefetch cache hit (0ms latency!)
        if (cachedItem && cachedItem.status === "ready" && cachedItem.audioUrl) {
            console.log("⚡ Zero Latency Cache Hit for:", topicTitle);
            const newChapter: GuideChapter = {
                id: `chapter-${Date.now()}`,
                title: topicTitle,
                icon: icon,
                script: cachedItem.scriptText,
                audioUrl: cachedItem.audioUrl,
                sources: cachedItem.sources,
            };

            setChapters((prev) => [...prev, newChapter]);
            setActiveChapterId(newChapter.id);
            setAudioUrl(cachedItem.audioUrl);
            if (cachedItem.nextTopics.length > 0) {
                setNextTopics(sanitizeTopicList(cachedItem.nextTopics));
            }

            // Track zero-latency hit event
            trackEvent("prefetch_hit", chapters.length + 1, topicTitle, true);

            setTimeout(() => {
                timelineEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 200);
            return;
        }

        // Standard On-Demand Fetch (if not in prefetch cache or custom question)
        setIsGenerating(true);
        setGenerationError(null);
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
            scriptText = cleanClientScript(scriptText);

            if (topicsHeader) {
                try {
                    const parsedTopics = JSON.parse(decodeURIComponent(topicsHeader));
                    if (Array.isArray(parsedTopics)) {
                        setNextTopics(sanitizeTopicList(parsedTopics));
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
            setGenerationError(null);
            setLastFailedAction(null);

            // Track standard chapter played event
            trackEvent("chapter_played", chapters.length + 1, topicTitle, false);

            setTimeout(() => {
                timelineEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 300);
        } catch (error: any) {
            console.error(error);
            setGenerationError(error.message || "ガイド原稿の生成に失敗しました。もう一度お試しください。");
            setLastFailedAction({ title: topicTitle, prompt: topicPrompt, icon });
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

    const t = SPOT_UI_STRINGS[selectedLanguage] || SPOT_UI_STRINGS.en;
    const currentInterests = INTERESTS_MAP[selectedLanguage] || INTERESTS_MAP.en;

    return (
        <main className="max-w-2xl mx-auto pb-40">
            {/* Top Bar with Back Link */}
            <div className="p-4 flex items-center justify-between">
                <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-bold transition-all shadow-2xs"
                >
                    <ArrowLeft className="w-4 h-4" />
                    {t.back}
                </Link>
            </div>

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
                        <h2 className="text-lg font-bold">{t.aboutSpot}</h2>
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
                                {t.profileTitle}
                            </h3>
                        </div>
                        <button
                            onClick={() => setIsEditingProfile(!isEditingProfile)}
                            className="text-xs font-bold text-blue-600 hover:text-blue-800"
                        >
                            {isEditingProfile ? t.save : t.edit}
                        </button>
                    </div>

                    {isEditingProfile ? (
                        <textarea
                            value={userProfile}
                            onChange={(e) => handleProfileChange(e.target.value)}
                            placeholder={t.profilePlaceholder}
                            rows={2}
                            className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none mt-1"
                        />
                    ) : (
                        <p className="text-xs text-blue-800 leading-relaxed font-medium">
                            {userProfile ? userProfile : t.noProfile}
                        </p>
                    )}
                </section>

                {/* Preferences (Interests only - Language selection removed since it is set on TOP page) */}
                {chapters.length === 0 && (
                    <div className="space-y-6 pt-2">
                        {/* Interest Selection */}
                        <section>
                            <div className="flex items-center gap-2 mb-3">
                                <Heart className="w-5 h-5 text-pink-500" />
                                <h2 className="text-base font-bold text-neutral-800">{t.interestsTitle}</h2>
                            </div>
                            <div className="grid grid-cols-2 gap-2.5">
                                {currentInterests.map((interest) => (
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
                            onClick={() => executeGenerate(t.defaultTopic, "", "✨")}
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
                                    {t.generateBtn}
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
                                    Story Timeline ({chapters.length})
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
                                                        {t.chapterPlaying}
                                                    </>
                                                ) : (
                                                    <>
                                                        <Play className="w-3.5 h-3.5 fill-current" />
                                                        {t.chapterPlay}
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
                                                    {t.sources}
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
                                        {/* Chapter Feedback Thumbs */}
                                        <div className="mt-3 pt-2 flex items-center justify-between border-t border-neutral-200/50 pl-7">
                                            <span className="text-[10px] text-neutral-400">{t.helpfulQ}</span>
                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    onClick={() => handleChapterFeedback(chapter.id, idx + 1, chapter.title, "good")}
                                                    className={cn(
                                                        "px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all",
                                                        chapterFeedbacks[chapter.id] === "good"
                                                            ? "bg-emerald-500 text-white shadow-2xs"
                                                            : "bg-white text-neutral-500 hover:text-neutral-800 border border-neutral-200 hover:bg-neutral-50"
                                                    )}
                                                    title="Good"
                                                >
                                                    <ThumbsUp className="w-3 h-3" />
                                                    {chapterFeedbacks[chapter.id] === "good" && t.helpfulGood}
                                                </button>
                                                <button
                                                    onClick={() => handleChapterFeedback(chapter.id, idx + 1, chapter.title, "bad")}
                                                    className={cn(
                                                        "px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all",
                                                        chapterFeedbacks[chapter.id] === "bad"
                                                            ? "bg-neutral-700 text-white shadow-2xs"
                                                            : "bg-white text-neutral-500 hover:text-neutral-800 border border-neutral-200 hover:bg-neutral-50"
                                                    )}
                                                    title="Bad"
                                                >
                                                    <ThumbsDown className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Error & Retry Card (Approach ①: Hide broken choices and show clean retry action) */}
                        {generationError && !isGenerating && (
                            <div className="pt-2">
                                <div className="p-4 bg-amber-50/90 border border-amber-200/90 rounded-2xl flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-bottom-2">
                                    <div className="flex items-center gap-3 mr-2 min-w-0">
                                        <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <AlertCircle className="w-5 h-5 text-amber-600" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-amber-900 truncate">
                                                {generationError}
                                            </p>
                                            <p className="text-[11px] text-amber-700 mt-0.5">
                                                {t.retryHint}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (lastFailedAction) {
                                                executeGenerate(lastFailedAction.title, lastFailedAction.prompt, lastFailedAction.icon);
                                            } else {
                                                executeGenerate(t.defaultTopic, "", "✨");
                                            }
                                        }}
                                        disabled={isGenerating}
                                        className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all flex-shrink-0"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                        {t.retry}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Next Topics / 3 Choices Section (Directly below chapters for seamless flow) */}
                        {!generationError && nextTopics.length > 0 && !isGenerating && (
                            <div className="pt-3 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="flex items-center gap-2 text-neutral-800">
                                    <Sparkles className="w-4 h-4 text-amber-500" />
                                    <h4 className="text-sm font-bold">
                                        {t.nextTopicsTitle}
                                    </h4>
                                </div>

                                <div className="grid grid-cols-1 gap-2.5">
                                    {nextTopics.map((rawTopic, idx) => {
                                        const topic = sanitizeTopic(rawTopic, idx);
                                        const cacheKey = (topic.prompt || topic.title || "").trim();
                                        const isReady = cacheKey ? prefetchCache[cacheKey]?.status === "ready" : false;
                                        return (
                                            <button
                                                key={topic.id}
                                                onClick={() => executeGenerate(topic.title, topic.prompt, topic.icon)}
                                                disabled={isGenerating}
                                                className={cn(
                                                    "group relative w-full p-3.5 rounded-2xl flex items-center justify-between text-left transition-all active:scale-98 border shadow-xs hover:shadow",
                                                    isReady
                                                        ? "bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-white border-blue-300 hover:border-blue-500 hover:shadow-blue-500/10"
                                                        : "bg-gradient-to-r from-neutral-50 to-blue-50/20 hover:from-blue-50/50 hover:to-blue-100/30 border-neutral-200 hover:border-blue-300"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="text-2xl p-1.5 bg-white rounded-xl shadow-2xs">
                                                        {topic.icon}
                                                    </span>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm font-bold text-neutral-900 group-hover:text-blue-700 transition-colors">
                                                                {topic.title}
                                                            </p>
                                                            {isReady && (
                                                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-md animate-in fade-in">
                                                                    <Zap className="w-2.5 h-2.5 fill-blue-600 text-blue-600" />
                                                                    {t.instantPlay}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-neutral-500 line-clamp-1 mt-0.5">
                                                            {topic.prompt}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="p-2 bg-white rounded-full text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors flex-shrink-0 ml-2 shadow-2xs">
                                                    <ArrowRight className="w-4 h-4" />
                                                </div>
                                            </button>
                                        );
                                    })}
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
                                    placeholder={t.askPlaceholder}
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

                        {/* Overall Spot Learning Reflection Card (Placed at the bottom for natural wrap-up) */}
                        {chapters.length >= 2 && !isGenerating && (
                            <div className="pt-4 border-t border-neutral-100/80">
                                <div className="p-4 bg-gradient-to-r from-amber-50/80 via-orange-50/50 to-amber-50/80 border border-amber-200/70 rounded-2xl shadow-2xs space-y-2.5 animate-in fade-in">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-amber-600" />
                                        <h4 className="text-xs font-bold text-amber-950">
                                            {t.feedbackQ}
                                        </h4>
                                    </div>
                                    {overallFeedback ? (
                                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-100/70 p-2.5 rounded-xl border border-emerald-200 animate-in fade-in">
                                            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                            {t.feedbackThanks}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                            <button
                                                onClick={() => handleOverallFeedback("discovery")}
                                                className="p-2.5 bg-white hover:bg-amber-100/60 border border-amber-200 text-amber-950 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs hover:shadow-xs transition-all active:scale-98 text-left"
                                            >
                                                <span className="text-xs">{t.feedbackDiscovery}</span>
                                            </button>
                                            <button
                                                onClick={() => handleOverallFeedback("respect")}
                                                className="p-2.5 bg-white hover:bg-orange-100/60 border border-orange-200 text-orange-950 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs hover:shadow-xs transition-all active:scale-98 text-left"
                                            >
                                                <span className="text-xs">{t.feedbackRespect}</span>
                                            </button>
                                            <button
                                                onClick={() => handleOverallFeedback("needs_improvement")}
                                                className="p-2.5 bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-600 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs hover:shadow-xs transition-all active:scale-98 text-left"
                                            >
                                                <span className="text-xs">{t.feedbackDifficult}</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

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

