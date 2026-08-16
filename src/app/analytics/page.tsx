"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    Activity,
    Zap,
    TrendingUp,
    Clock,
    DollarSign,
    Globe,
    Layers,
    Sparkles,
    ArrowLeft,
    RefreshCw,
    Play,
    CheckCircle2,
    BarChart3,
    Compass,
    Radio,
    GraduationCap,
    HeartHandshake,
    BookOpen,
    Lightbulb,
    Award,
    ArrowRight,
    Trash2,
    Calendar
} from "lucide-react";
import { AnalyticsSummary } from "@/lib/analyticsStore";

export default function AnalyticsDashboardPage() {
    const [data, setData] = useState<AnalyticsSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLiveRefreshing, setIsLiveRefreshing] = useState(true);
    const [isSimulating, setIsSimulating] = useState(false);
    const [selectedRange, setSelectedRange] = useState<"today" | "7d" | "30d" | "all">("all");

    const fetchSummary = async (range: string = selectedRange) => {
        try {
            const res = await fetch(`/api/analytics?range=${range}`);
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
        } catch (e) {
            console.error("Failed to fetch analytics:", e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSummary(selectedRange);
        let interval: NodeJS.Timeout | null = null;
        if (isLiveRefreshing) {
            interval = setInterval(() => {
                fetchSummary(selectedRange);
            }, 3000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isLiveRefreshing, selectedRange]);

    const handleRangeChange = (range: "today" | "7d" | "30d" | "all") => {
        setSelectedRange(range);
        setIsLoading(true);
        fetchSummary(range);
    };

    const handleClearData = async () => {
        if (!confirm("蓄積されたすべての分析データをクリアしますか？")) return;
        try {
            await fetch("/api/analytics", { method: "DELETE" });
            await fetchSummary(selectedRange);
        } catch (e) {
            console.error("Clear error:", e);
        }
    };

    const handleSendTestEvent = async () => {
        setIsSimulating(true);
        const spots = [
            { id: "asakusa-temple", name: "Senso-ji Temple (浅草寺)" },
            { id: "kinkaku-ji", name: "Kinkaku-ji (金閣寺)" },
            { id: "national-stadium", name: "National Stadium (国立競技場)" },
        ];
        const s = spots[Math.floor(Math.random() * spots.length)];
        const randomChapter = Math.floor(Math.random() * 8) + 3;
        const isZero = Math.random() > 0.1;

        try {
            await fetch("/api/analytics", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sessionId: `demo-live-${Date.now()}`,
                    spotId: s.id,
                    spotName: s.name,
                    language: "en",
                    eventType: isZero ? "prefetch_hit" : "chapter_played",
                    chapterIndex: randomChapter,
                    topicTitle: "伝統宮大工の超絶木組みと精神性",
                    isZeroLatency: isZero,
                    estimatedCostJpy: isZero ? 1.10 : 0.37,
                }),
            });
            await fetchSummary(selectedRange);
        } catch (e) {
            console.error("Simulation error:", e);
        } finally {
            setIsSimulating(false);
        }
    };

    if (isLoading && !data) {
        return (
            <div className="min-h-screen bg-[#090d16] text-white flex flex-col items-center justify-center">
                <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mb-4" />
                <p className="text-neutral-400 font-medium text-sm">Loading Cognitive Insight Analytics...</p>
            </div>
        );
    }

    const totalLang = Object.values(data?.languageDistribution || {}).reduce((a, b) => a + b, 0) || 1;
    const hasData = (data?.totalSessions || 0) > 0;

    return (
        <div className="min-h-screen bg-[#090d16] text-neutral-100 font-sans p-4 sm:p-8">
            <div className="max-w-7xl mx-auto space-y-7">
                {/* Header */}
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6 border-b border-neutral-800/80">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/"
                            className="p-2.5 bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700/80 text-neutral-300 rounded-xl transition-all shadow-sm"
                            title="Back to App"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2.5">
                                <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                                    <GraduationCap className="w-6 h-6 text-amber-400" />
                                    知的エンゲージメント ＆ 学びの深化分析
                                </h1>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-full">
                                    <Radio className="w-3 h-3 animate-pulse" />
                                    LIVE INSIGHTS
                                </span>
                            </div>
                            <p className="text-xs text-neutral-400 mt-1">
                                旅行者が観光資源の「歴史的起源・職人の手仕事・本質的価値」にどこまで深く共鳴したかの可視化
                            </p>
                        </div>
                    </div>

                    {/* Actions & Filters */}
                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                        {/* Time Range Selector */}
                        <div className="flex items-center bg-neutral-900/90 border border-neutral-700/80 rounded-xl p-1 shadow-sm">
                            <span className="px-2 text-neutral-400 text-xs flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                期間:
                            </span>
                            {[
                                { key: "today", label: "今日" },
                                { key: "7d", label: "過去7日" },
                                { key: "30d", label: "過去30日" },
                                { key: "all", label: "全期間" },
                            ].map((r) => (
                                <button
                                    key={r.key}
                                    onClick={() => handleRangeChange(r.key as any)}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                        selectedRange === r.key
                                            ? "bg-amber-500 text-neutral-950 shadow-xs"
                                            : "text-neutral-400 hover:text-white"
                                    }`}
                                >
                                    {r.label}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={handleSendTestEvent}
                            disabled={isSimulating}
                            className="px-3.5 py-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                        >
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            {isSimulating ? "送信中..." : "デモ体験送信"}
                        </button>

                        <button
                            onClick={() => setIsLiveRefreshing(!isLiveRefreshing)}
                            className={`px-3.5 py-2 border text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-sm ${
                                isLiveRefreshing
                                    ? "bg-neutral-900 border-neutral-700 text-neutral-300"
                                    : "bg-amber-500/20 border-amber-500/40 text-amber-300"
                            }`}
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${isLiveRefreshing ? "animate-spin text-emerald-400" : ""}`} />
                            {isLiveRefreshing ? "自動更新 (3s)" : "停止中"}
                        </button>

                        <button
                            onClick={handleClearData}
                            className="p-2 bg-neutral-900 hover:bg-red-500/20 border border-neutral-700 hover:border-red-500/40 text-neutral-400 hover:text-red-400 rounded-xl transition-all shadow-sm"
                            title="データをクリア"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Empty State Banner if no data */}
                {!hasData && (
                    <div className="p-8 bg-neutral-900/60 border border-neutral-800 rounded-2xl text-center space-y-3 animate-in fade-in">
                        <div className="w-12 h-12 rounded-2xl bg-neutral-800 flex items-center justify-center mx-auto text-neutral-400">
                            <Activity className="w-6 h-6 text-amber-400" />
                        </div>
                        <h3 className="text-base font-bold text-white">指定された期間にまだ利用データがありません</h3>
                        <p className="text-xs text-neutral-400 max-w-md mx-auto">
                            ガイドアプリで音声を再生するとリアルタイムに反映されます。または右上の「**デモ体験送信**」ボタンを押してテストデータを投入できます。
                        </p>
                        <div className="pt-2">
                            <Link
                                href="/"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                            >
                                <Play className="w-3.5 h-3.5" />
                                音声ガイドを試してみる
                            </Link>
                        </div>
                    </div>
                )}

                {/* KPI Top Cards (Cognitive Focus) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Card 1: Cognitive Engagement Score (CES) */}
                    <div className="p-5 bg-gradient-to-br from-neutral-900/95 via-neutral-900/80 to-amber-950/20 border border-amber-500/30 rounded-2xl relative overflow-hidden shadow-xl">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-amber-300/80 tracking-wide uppercase">知的エンゲージメント指数 (CES)</span>
                            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400">
                                <Award className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-3 flex items-baseline gap-2">
                            <span className="text-3xl font-black text-white">{data?.cognitiveEngagementScore || 0}</span>
                            <span className="text-xs text-amber-300 font-bold">/ 100 pt</span>
                        </div>
                        <p className="text-[11px] text-amber-400/90 font-medium mt-2 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-amber-400" />
                            平均深掘り {data?.avgChaptersPerSession || 0} チャプター
                        </p>
                    </div>

                    {/* Card 2: Deep Learning Attainment Rate */}
                    <div className="p-5 bg-gradient-to-br from-neutral-900/95 via-neutral-900/80 to-purple-950/20 border border-purple-500/30 rounded-2xl relative overflow-hidden shadow-xl">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-purple-300/80 tracking-wide uppercase">文化的学び・敬意到達率</span>
                            <div className="p-2 bg-purple-500/10 rounded-xl text-purple-400">
                                <BookOpen className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-3 flex items-baseline gap-2">
                            <span className="text-3xl font-black text-purple-300">{data?.deepLearningAttainmentRate || 0}%</span>
                            <span className="text-xs text-neutral-400 font-medium">の利用者が達成</span>
                        </div>
                        <p className="text-[11px] text-purple-400 font-medium mt-2 flex items-center gap-1">
                            単なる観光から「本質への理解」へ昇華
                        </p>
                    </div>

                    {/* Card 3: Zero Latency Experience */}
                    <div className="p-5 bg-gradient-to-br from-neutral-900/95 via-neutral-900/80 to-blue-950/20 border border-blue-500/30 rounded-2xl relative overflow-hidden shadow-xl">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-blue-300/80 tracking-wide uppercase">⚡ 0秒即時再生率 (ストレスゼロ)</span>
                            <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400">
                                <Zap className="w-4 h-4 fill-blue-400" />
                            </div>
                        </div>
                        <div className="mt-3 flex items-baseline gap-2">
                            <span className="text-3xl font-black text-blue-300">{data?.zeroLatencyRate || 0}%</span>
                            <span className="text-xs text-neutral-400 font-medium">即時再生</span>
                        </div>
                        <p className="text-[11px] text-blue-400 font-medium mt-2 flex items-center gap-1">
                            投機的プリフェッチで思考の途切れを排除
                        </p>
                    </div>

                    {/* Card 4: Cost per Deep Session */}
                    <div className="p-5 bg-gradient-to-br from-neutral-900/95 via-neutral-900/80 to-emerald-950/20 border border-emerald-500/30 rounded-2xl relative overflow-hidden shadow-xl">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-emerald-300/80 tracking-wide uppercase">1スポット満喫時の原価</span>
                            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
                                <DollarSign className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-3 flex items-baseline gap-2">
                            <span className="text-3xl font-black text-emerald-300">¥{data?.avgCostPerSessionJpy || 0}</span>
                            <span className="text-xs text-neutral-400 font-medium">/ 10チャプター</span>
                        </div>
                        <p className="text-[11px] text-emerald-400 font-medium mt-2 flex items-center gap-1">
                            累計OPEX: ¥{data?.totalOpexJpy?.toLocaleString() || 0} (粗利95%+)
                        </p>
                    </div>
                </div>

                {/* Section 1: 4-Stage Cognitive Transformation Funnel */}
                <div className="p-6 bg-neutral-900/90 border border-neutral-800 rounded-2xl shadow-xl space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                            <div className="flex items-center gap-2">
                                <Compass className="w-5 h-5 text-amber-400" />
                                <h2 className="text-base font-bold text-white">
                                    学びの深化ジャーニー (Cognitive Transformation Stages)
                                </h2>
                            </div>
                            <p className="text-xs text-neutral-400 mt-1">
                                旅行者がどのように感性を開かれ、表面的な観光から「歴史の起源」や「職人の精神性」へ到達したかを4段階で測定
                            </p>
                        </div>
                        <span className="text-xs font-bold px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-full self-start sm:self-auto">
                            最終ステージ到達率: {data?.cognitiveStages[3]?.percentage || 0}%
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
                        {data?.cognitiveStages.map((stg) => (
                            <div
                                key={stg.stage}
                                className="p-4 bg-neutral-800/60 border border-neutral-700/70 rounded-2xl relative overflow-hidden flex flex-col justify-between space-y-3 hover:border-neutral-600 transition-all"
                            >
                                <div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-2xl p-1.5 bg-neutral-900/80 rounded-xl shadow-xs">
                                            {stg.icon}
                                        </span>
                                        <span className="text-xs font-black text-amber-300">
                                            {stg.percentage}% 到達
                                        </span>
                                    </div>
                                    <h3 className="text-sm font-bold text-white mt-3">
                                        {stg.title}
                                    </h3>
                                    <p className="text-[11px] text-neutral-400 mt-1.5 leading-relaxed">
                                        {stg.description}
                                    </p>
                                </div>

                                <div className="space-y-1 pt-2">
                                    <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full bg-gradient-to-r ${stg.color} rounded-full transition-all duration-700`}
                                            style={{ width: `${stg.percentage}%` }}
                                        />
                                    </div>
                                    <span className="text-[10px] text-neutral-500 font-mono text-right block">
                                        {stg.count} セッション
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Section 2: Persona Translation & Top Learned Concepts */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left 6 cols: Persona to Heritage Translation */}
                    <div className="lg:col-span-6 p-6 bg-neutral-900/90 border border-neutral-800 rounded-2xl shadow-xl space-y-4">
                        <div className="flex items-center gap-2">
                            <HeartHandshake className="w-5 h-5 text-purple-400" />
                            <h3 className="text-base font-bold text-white">
                                ペルソナ別「本質価値への翻訳」成功率
                            </h3>
                        </div>
                        <p className="text-xs text-neutral-400">
                            旅行者の個人的な関心（映え・アニメ・食）を入口に、文化の本質価値へと導けた確率
                        </p>

                        <div className="space-y-3 pt-2">
                            {data?.personaTranslations.map((pt, idx) => (
                                <div
                                    key={idx}
                                    className="p-3.5 bg-neutral-800/50 border border-neutral-700/60 rounded-xl space-y-2"
                                >
                                    <div className="flex items-center justify-between text-xs font-bold">
                                        <span className="text-white flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-purple-400" />
                                            {pt.personaName}
                                        </span>
                                        <span className="text-emerald-400 font-mono text-xs">
                                            成功率 {pt.successRate}%
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[11px] text-neutral-400 bg-neutral-900/70 p-2 rounded-lg">
                                        <span className="text-neutral-300 truncate max-w-[140px]">
                                            {pt.entryInterest}
                                        </span>
                                        <ArrowRight className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                                        <span className="text-amber-200 font-medium truncate flex-1">
                                            {pt.destinationInsight}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right 6 cols: Subjective Feedback & Acquired Concepts */}
                    <div className="lg:col-span-6 space-y-6">
                        {/* Subjective Feedback Breakdown Card */}
                        <div className="p-6 bg-neutral-900/90 border border-neutral-800 rounded-2xl shadow-xl space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-amber-400" />
                                    <h3 className="text-base font-bold text-white">
                                        旅行者の主観的評価・学びリアクション
                                    </h3>
                                </div>
                                <span className="text-xs font-bold px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full">
                                    満足度 {data?.subjectiveSatisfactionRate || 0}%
                                </span>
                            </div>
                            <p className="text-xs text-neutral-400">
                                音声ガイド聴取後に旅行者が直接回答した「学びの実感」と各チャプター評価
                            </p>

                            <div className="grid grid-cols-3 gap-2.5 pt-1">
                                <div className="p-3 bg-neutral-800/60 border border-amber-500/20 rounded-xl text-center">
                                    <span className="text-xl">💡</span>
                                    <p className="text-xs font-bold text-amber-300 mt-1">新しい発見</p>
                                    <p className="text-lg font-black text-white mt-0.5">
                                        {data?.feedbackBreakdown?.discovery || 0}
                                        <span className="text-[10px] font-normal text-neutral-400"> 票</span>
                                    </p>
                                </div>
                                <div className="p-3 bg-neutral-800/60 border border-orange-500/20 rounded-xl text-center">
                                    <span className="text-xl">✨</span>
                                    <p className="text-xs font-bold text-orange-300 mt-1">歴史に感動</p>
                                    <p className="text-lg font-black text-white mt-0.5">
                                        {data?.feedbackBreakdown?.respect || 0}
                                        <span className="text-[10px] font-normal text-neutral-400"> 票</span>
                                    </p>
                                </div>
                                <div className="p-3 bg-neutral-800/60 border border-neutral-700/60 rounded-xl text-center">
                                    <span className="text-xl">🤔</span>
                                    <p className="text-xs font-bold text-neutral-400 mt-1">要改善</p>
                                    <p className="text-lg font-black text-neutral-300 mt-0.5">
                                        {data?.feedbackBreakdown?.needs_improvement || 0}
                                        <span className="text-[10px] font-normal text-neutral-400"> 票</span>
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-neutral-800 text-xs text-neutral-400">
                                <span>チャプター評価累計:</span>
                                <div className="flex items-center gap-3">
                                    <span className="text-emerald-400 font-bold">
                                        👍 {data?.feedbackBreakdown?.chapterGood || 0} Good
                                    </span>
                                    <span className="text-neutral-500">
                                        👎 {data?.feedbackBreakdown?.chapterBad || 0} Bad
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Top Acquired Heritage Concepts */}
                        <div className="p-6 bg-neutral-900/90 border border-neutral-800 rounded-2xl shadow-xl space-y-4">
                            <div className="flex items-center gap-2">
                                <Lightbulb className="w-5 h-5 text-amber-400" />
                                <h3 className="text-base font-bold text-white">
                                    持ち帰られた「本質的学び・知恵」
                                </h3>
                            </div>

                            <div className="space-y-2 pt-1">
                                {data?.topLearnedConcepts.length === 0 ? (
                                    <p className="text-xs text-neutral-500 italic py-4 text-center">
                                        まだ習得されたインサイトがありません
                                    </p>
                                ) : (
                                    data?.topLearnedConcepts.map((item, idx) => (
                                        <div
                                            key={idx}
                                            className="p-2.5 bg-neutral-800/50 border border-neutral-700/60 rounded-xl flex items-center justify-between"
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="w-5 h-5 rounded-md bg-amber-500/10 text-amber-400 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                                                    {idx + 1}
                                                </span>
                                                <p className="text-xs font-bold text-neutral-200 truncate">
                                                    {item.concept}
                                                </p>
                                            </div>
                                            <span className="text-[11px] font-mono text-neutral-400 flex-shrink-0 ml-2">
                                                {item.count} 回習得
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 3: Live Real-time Activity Log Stream */}
                <div className="p-6 bg-neutral-900/90 border border-neutral-800 rounded-2xl shadow-xl space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-blue-400" />
                            <h3 className="text-base font-bold text-white">リアルタイム・知的対話ストリーム (Live Learning Stream)</h3>
                        </div>
                        <span className="text-xs text-neutral-400">最新 {data?.recentEvents.length || 0} 件</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-neutral-800 text-neutral-400 font-bold uppercase tracking-wider">
                                    <th className="pb-3 px-3">時刻</th>
                                    <th className="pb-3 px-3">スポット</th>
                                    <th className="pb-3 px-3">言語</th>
                                    <th className="pb-3 px-3">学びステージ</th>
                                    <th className="pb-3 px-3">習得された文化的インサイト</th>
                                    <th className="pb-3 px-3">応答</th>
                                    <th className="pb-3 px-3 text-right">推定原価</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-800/60 font-medium">
                                {data?.recentEvents.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-8 text-center text-neutral-500 italic">
                                            イベントログがありません
                                        </td>
                                    </tr>
                                ) : (
                                    data?.recentEvents.map((evt) => {
                                        const timeStr = new Date(evt.timestamp).toLocaleTimeString("ja-JP", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                            second: "2-digit",
                                        });

                                        let stageBadge = (
                                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded font-bold">
                                                Stage 1 [安心]
                                            </span>
                                        );
                                        if (evt.insightStage === "discovery") {
                                            stageBadge = (
                                                <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded font-bold">
                                                    Stage 2 [発見]
                                                </span>
                                            );
                                        } else if (evt.insightStage === "learning") {
                                            stageBadge = (
                                                <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded font-bold">
                                                    Stage 3 [学び]
                                                </span>
                                            );
                                        } else if (evt.insightStage === "respect") {
                                            stageBadge = (
                                                <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded font-bold">
                                                    Stage 4 [敬意]
                                                </span>
                                            );
                                        }

                                        return (
                                            <tr key={evt.id} className="hover:bg-neutral-800/40 transition-colors">
                                                <td className="py-3 px-3 text-neutral-400 font-mono">{timeStr}</td>
                                                <td className="py-3 px-3 text-white font-bold">{evt.spotName}</td>
                                                <td className="py-3 px-3">
                                                    <span className="px-2 py-0.5 bg-neutral-800 rounded text-[11px] text-neutral-300 font-mono uppercase">
                                                        {evt.language}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-3">{stageBadge}</td>
                                                <td className="py-3 px-3 text-neutral-200 truncate max-w-[280px]">
                                                    {evt.learnedConcept || evt.topicTitle || "文化的概要"}
                                                </td>
                                                <td className="py-3 px-3">
                                                    {evt.isZeroLatency ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-bold rounded-md">
                                                            <Zap className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                                                            0ms 即時
                                                        </span>
                                                    ) : (
                                                        <span className="text-neutral-400 text-[11px]">
                                                            通常 (2.4s)
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-3 text-right font-mono text-emerald-400">
                                                    ¥{evt.estimatedCostJpy?.toFixed(2)}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
