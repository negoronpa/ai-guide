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
    Calendar,
    Download,
    FileText,
    Database,
    ChevronDown,
    ChevronUp,
    X,
    ExternalLink,
    ThumbsUp,
    ThumbsDown,
    User,
    Search
} from "lucide-react";
import { AnalyticsSummary, FullSessionLog } from "@/lib/analyticsStore";

export default function AnalyticsDashboardPage() {
    const [data, setData] = useState<AnalyticsSummary | null>(null);
    const [sessions, setSessions] = useState<FullSessionLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLiveRefreshing, setIsLiveRefreshing] = useState(true);
    const [isSimulating, setIsSimulating] = useState(false);
    const [selectedRange, setSelectedRange] = useState<"today" | "7d" | "30d" | "all">("all");
    const [selectedSessionModal, setSelectedSessionModal] = useState<FullSessionLog | null>(null);
    const [showSqlGuide, setShowSqlGuide] = useState(false);
    const [searchFilter, setSearchFilter] = useState("");

    const fetchSummary = async (range: string = selectedRange) => {
        try {
            const [resSummary, resSessions] = await Promise.all([
                fetch(`/api/analytics?range=${range}`),
                fetch(`/api/analytics?type=sessions`),
            ]);

            if (resSummary.ok) {
                const json = await resSummary.json();
                setData(json);
            }
            if (resSessions.ok) {
                const jsonSessions = await resSessions.json();
                setSessions(jsonSessions.sessions || []);
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
            }, 4000);
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

    const handleDownloadCsv = () => {
        window.open("/api/analytics?format=csv", "_blank");
    };

    const handleDownloadJson = () => {
        const jsonStr = JSON.stringify(sessions, null, 2);
        const blob = new Blob([jsonStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `inbound_ai_guide_sessions_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleSendTestEvent = async () => {
        setIsSimulating(true);
        const spots = [
            { id: "asakusa-temple", name: "Senso-ji Temple (浅草寺)", loc: "浅草" },
            { id: "kinkaku-ji", name: "Kinkaku-ji (金閣寺)", loc: "京都" },
        ];
        const s = spots[Math.floor(Math.random() * spots.length)];
        const testSessionId = `test-sess-${Date.now()}`;

        try {
            await fetch("/api/analytics", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "full_session_sync",
                    sessionId: testSessionId,
                    spotId: s.id,
                    spotName: s.name,
                    spotLocation: s.loc,
                    language: "ja",
                    userProfile: "19歳浪人生・東大文二志望。歴史と建築美に深い関心がある。",
                    interests: ["history", "culture"],
                    totalChapters: 3,
                    overallFeedback: "respect",
                    chapterFeedbacks: { "chapter-1": "good", "chapter-2": "good" },
                    journeyTimeline: [
                        {
                            timestamp: new Date().toISOString(),
                            chapterIndex: 1,
                            selectedTopic: { title: "ハイライトガイド", prompt: "", icon: "✨" },
                            presentedOptionsBeforeSelection: [
                                { id: "1", icon: "🐉", title: "提灯底面の龍彫刻", prompt: "底面の彫刻の秘密" },
                                { id: "2", icon: "🏛️", title: "宮大工の木組み", prompt: "釘を使わない建築技法" },
                            ],
                            script: "浅草寺は628年に創建された都内最古の寺院です。受験勉強で出会う近代建築とは異なり、1400年の祈りと町衆の美意識が息づいています。",
                            isZeroLatencyPrefetched: false,
                        },
                        {
                            timestamp: new Date().toISOString(),
                            chapterIndex: 2,
                            selectedTopic: { title: "提灯底面の龍彫刻", prompt: "底面の彫刻の秘密", icon: "🐉" },
                            presentedOptionsBeforeSelection: [
                                { id: "3", icon: "🏮", title: "丹後和紙の職人技", prompt: "手漉き和紙の耐久性" },
                            ],
                            script: "雷門をくぐる際、真上を見上げてください。実は底面には火災除けの水神である木彫りの龍が刻まれています。江戸の大火から町を守る切実な祈りの結晶です。",
                            isZeroLatencyPrefetched: true,
                        },
                    ],
                }),
            });
            await fetchSummary(selectedRange);
        } catch (e) {
            console.error("Test send error:", e);
        } finally {
            setIsSimulating(false);
        }
    };

    const filteredSessions = sessions.filter((s) => {
        if (!searchFilter.trim()) return true;
        const q = searchFilter.toLowerCase();
        return (
            s.spotName.toLowerCase().includes(q) ||
            (s.userProfile || "").toLowerCase().includes(q) ||
            s.sessionId.toLowerCase().includes(q) ||
            s.language.toLowerCase().includes(q)
        );
    });

    const sqlCreateTableScript = `CREATE TABLE IF NOT EXISTS session_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    spot_id TEXT NOT NULL,
    spot_name TEXT NOT NULL,
    spot_location TEXT,
    language TEXT NOT NULL,
    user_profile TEXT,
    interests JSONB,
    total_chapters INTEGER DEFAULT 1,
    overall_feedback TEXT,
    chapter_feedbacks JSONB,
    journey_timeline JSONB
);

-- インデックス作成（高速検索用）
CREATE INDEX IF NOT EXISTS idx_session_logs_created_at ON session_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_session_logs_spot_id ON session_logs (spot_id);`;

    return (
        <main className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <Link
                                href="/"
                                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                            </Link>
                            <div className="flex items-center gap-2">
                                <Activity className="w-6 h-6 text-blue-400 animate-pulse" />
                                <h1 className="text-2xl font-bold text-white tracking-tight">
                                    実証実験 ＆ 認知的エンゲージメント分析ダッシュボード
                                </h1>
                            </div>
                        </div>
                        <p className="text-xs text-slate-400 pl-11">
                            観光資源の価値翻訳成功率・4象限認知的足場かけ・全対話セッションログの一括エクスポート
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Time Range Filter */}
                        <div className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700 text-xs font-semibold">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 ml-2 mr-1" />
                            {(["today", "7d", "30d", "all"] as const).map((range) => (
                                <button
                                    key={range}
                                    onClick={() => handleRangeChange(range)}
                                    className={`px-2.5 py-1 rounded-lg transition-all ${
                                        selectedRange === range
                                            ? "bg-blue-600 text-white shadow-xs"
                                            : "text-slate-400 hover:text-white"
                                    }`}
                                >
                                    {range === "today" ? "今日" : range === "7d" ? "過去7日" : range === "30d" ? "過去30日" : "全期間"}
                                </button>
                            ))}
                        </div>

                        <Link
                            href="/analytics/logs"
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-95"
                        >
                            <Search className="w-3.5 h-3.5" />
                            <span>ログ検索・選択エクスポート画面へ</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Link>

                        {/* Live Refresh Toggle */}
                        <button
                            onClick={() => setIsLiveRefreshing(!isLiveRefreshing)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                                isLiveRefreshing
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                    : "bg-slate-800 text-slate-400 border-slate-700"
                            }`}
                        >
                            <Radio className={`w-3.5 h-3.5 ${isLiveRefreshing ? "animate-pulse" : ""}`} />
                            {isLiveRefreshing ? "LIVE更新中" : "一時停止中"}
                        </button>

                        <button
                            onClick={handleClearData}
                            className="p-2 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-xl border border-slate-700 transition-colors"
                            title="データをクリア"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* KPI Overview Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-xs">
                        <div className="flex items-center justify-between text-slate-400 mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider">総セッション数</span>
                            <Compass className="w-4 h-4 text-blue-400" />
                        </div>
                        <div className="text-3xl font-extrabold text-white">
                            {data?.totalSessions ?? 0}
                            <span className="text-sm font-normal text-slate-400 ml-1">回</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">累計体験ユニークセッション</p>
                    </div>

                    <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-xs">
                        <div className="flex items-center justify-between text-slate-400 mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider">CES (知的没入指数)</span>
                            <Award className="w-4 h-4 text-amber-400" />
                        </div>
                        <div className="text-3xl font-extrabold text-amber-400">
                            {data?.cognitiveEngagementScore ?? 0}
                            <span className="text-sm font-normal text-slate-400 ml-1">/100</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">深掘り率・学び達成・満足度総合</p>
                    </div>

                    <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-xs">
                        <div className="flex items-center justify-between text-slate-400 mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider">主観的満足度 (Feedback)</span>
                            <HeartHandshake className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="text-3xl font-extrabold text-emerald-400">
                            {data?.subjectiveSatisfactionRate ?? 0}
                            <span className="text-sm font-normal text-slate-400 ml-1">%</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">💡発見・✨感動のポジティブ回答率</p>
                    </div>

                    <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-xs">
                        <div className="flex items-center justify-between text-slate-400 mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider">0ms 即時再生率</span>
                            <Zap className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div className="text-3xl font-extrabold text-cyan-400">
                            {data?.zeroLatencyRate ?? 0}
                            <span className="text-sm font-normal text-slate-400 ml-1">%</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">投機的プリフェッチ成功率</p>
                    </div>
                </div>

                {/* ========================================================================= */}
                {/* 📥 PoC 実証実験セッションログ管理 ＆ 一括ダウンロードセクション */}
                {/* ========================================================================= */}
                <div className="bg-slate-800/90 border border-blue-500/30 rounded-3xl p-6 shadow-xl space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-700">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-2xl border border-blue-500/30">
                                <Database className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    実証実験 セッション対話ログ管理 (全 {sessions.length} 件)
                                    <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full font-semibold">
                                        クラウド永続化対応
                                    </span>
                                </h2>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    全利用者の属性、各チャプターの会話スクリプト、提示された3択、選んだトピック、評価ログを一括エクスポート
                                </p>
                            </div>
                        </div>

                        {/* Export Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2">
                            <Link
                                href="/analytics/logs"
                                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95"
                            >
                                <Search className="w-4 h-4" />
                                📋 条件検索・選択DL画面を開く
                                <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                            <button
                                onClick={handleDownloadCsv}
                                className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-95"
                                title="Excelで文字化けしないUTF-8 BOM付きCSVファイルをダウンロード"
                            >
                                <Download className="w-3.5 h-3.5" />
                                全件CSV
                            </button>
                            <button
                                onClick={handleDownloadJson}
                                className="px-3 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-600 transition-all active:scale-95"
                                title="完全な階層構造JSONファイルをダウンロード"
                            >
                                <FileText className="w-3.5 h-3.5 text-blue-400" />
                                全件JSON
                            </button>
                            <button
                                onClick={handleSendTestEvent}
                                disabled={isSimulating}
                                className="px-3 py-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 rounded-xl text-xs font-semibold border border-blue-500/30 transition-all flex items-center gap-1.5"
                            >
                                <Play className="w-3.5 h-3.5" />
                                {isSimulating ? "生成中..." : "テストセッション注入"}
                            </button>
                        </div>
                    </div>

                    {/* Filter & Search Bar */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="relative w-full sm:w-80">
                            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                            <input
                                type="text"
                                value={searchFilter}
                                onChange={(e) => setSearchFilter(e.target.value)}
                                placeholder="スポット名・属性・IDで絞り込み..."
                                className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                            />
                        </div>
                        <button
                            onClick={() => setShowSqlGuide(!showSqlGuide)}
                            className="text-xs text-slate-400 hover:text-blue-400 flex items-center gap-1 transition-colors"
                        >
                            <Database className="w-3.5 h-3.5" />
                            Supabase SQLテーブル設定ガイド {showSqlGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                    </div>

                    {/* SQL Guide Accordion */}
                    {showSqlGuide && (
                        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-mono text-slate-300 space-y-2 animate-in fade-in">
                            <div className="flex items-center justify-between text-slate-400">
                                <span>Supabase SQL Editor で以下を実行すると、専用テーブルが自動作成されます：</span>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(sqlCreateTableScript);
                                        alert("SQLをクリップボードにコピーしました！");
                                    }}
                                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px]"
                                >
                                    SQLをコピー
                                </button>
                            </div>
                            <pre className="overflow-x-auto p-3 bg-slate-900 rounded-xl text-[11px] text-blue-300">
                                {sqlCreateTableScript}
                            </pre>
                        </div>
                    )}

                    {/* Sessions Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-slate-700 text-slate-400 font-bold uppercase tracking-wider">
                                    <th className="py-3 px-4">日時 / セッションID</th>
                                    <th className="py-3 px-4">観光スポット</th>
                                    <th className="py-3 px-4">旅行者属性 (ペルソナ)</th>
                                    <th className="py-3 px-4 text-center">言語</th>
                                    <th className="py-3 px-4 text-center">体験チャプター</th>
                                    <th className="py-3 px-4 text-center">学び評価</th>
                                    <th className="py-3 px-4 text-right">アクション</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {filteredSessions.length > 0 ? (
                                    filteredSessions.map((s) => (
                                        <tr key={s.sessionId} className="hover:bg-slate-800/60 transition-colors">
                                            <td className="py-3 px-4 font-mono text-slate-400">
                                                <div>{new Date(s.createdAt).toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
                                                <div className="text-[10px] text-slate-500 truncate max-w-[120px]">{s.sessionId}</div>
                                            </td>
                                            <td className="py-3 px-4 font-bold text-white">
                                                {s.spotName}
                                            </td>
                                            <td className="py-3 px-4 text-slate-300 max-w-[240px] truncate" title={s.userProfile}>
                                                {s.userProfile || <span className="text-slate-500">未設定</span>}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <span className="px-2 py-0.5 bg-slate-700 text-slate-300 rounded font-semibold uppercase">
                                                    {s.language}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-center font-bold text-blue-400">
                                                {s.totalChapters} 章
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                {s.overallFeedback === "respect" ? (
                                                    <span className="px-2 py-0.5 bg-orange-500/20 text-orange-300 rounded-full font-bold">✨ 歴史に感動</span>
                                                ) : s.overallFeedback === "discovery" ? (
                                                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded-full font-bold">💡 発見</span>
                                                ) : s.overallFeedback === "needs_improvement" ? (
                                                    <span className="px-2 py-0.5 bg-slate-700 text-slate-400 rounded-full">🤔 難しかった</span>
                                                ) : (
                                                    <span className="text-slate-500">-</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <button
                                                    onClick={() => setSelectedSessionModal(s)}
                                                    className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white rounded-lg font-semibold transition-colors inline-flex items-center gap-1"
                                                >
                                                    <span>詳細ジャーニー</span>
                                                    <ArrowRight className="w-3 h-3" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="py-8 text-center text-slate-500">
                                            {searchFilter ? "検索条件に一致するセッションが見つかりませんでした。" : "まだセッションログがありません。音声ガイドを体験すると自動的にここに記録されます。"}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Cognitive Scaffolding 4-Stage Distribution */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xs">
                        <div className="flex items-center gap-2 mb-4">
                            <GraduationCap className="w-5 h-5 text-blue-400" />
                            <h3 className="text-base font-bold text-white">4段階の認知変容ジャーニー達成率</h3>
                        </div>
                        <div className="space-y-4">
                            {(data?.cognitiveStages || []).map((stage, idx) => (
                                <div key={idx} className="space-y-1.5">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-bold text-slate-200 flex items-center gap-1.5">
                                            <span>{stage.icon}</span>
                                            {stage.title}
                                        </span>
                                        <span className="font-mono text-slate-400">
                                            {stage.count}件 ({stage.percentage}%)
                                        </span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${stage.color} rounded-full transition-all duration-500`}
                                            style={{ width: `${Math.min(100, Math.max(stage.percentage, 5))}%` }}
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-400">{stage.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xs">
                        <div className="flex items-center gap-2 mb-4">
                            <Lightbulb className="w-5 h-5 text-amber-400" />
                            <h3 className="text-base font-bold text-white">ペルソナ別・価値翻訳成功率</h3>
                        </div>
                        <div className="space-y-3">
                            {(data?.personaTranslations || []).map((pt, idx) => (
                                <div key={idx} className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-200">{pt.personaName}</span>
                                        <span className="text-xs font-extrabold text-emerald-400 font-mono">
                                            成功率 {pt.successRate}%
                                        </span>
                                    </div>
                                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                                        <span className="text-slate-500">入口:</span>
                                        <span>{pt.entryInterest}</span>
                                        <span className="text-blue-400">➔</span>
                                        <span className="text-slate-300 font-semibold">{pt.destinationInsight}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ========================================================================= */}
            {/* 🔍 Session Detail Journey Modal */}
            {/* ========================================================================= */}
            {selectedSessionModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 p-4 flex items-center justify-center animate-in fade-in">
                    <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="px-2.5 py-0.5 bg-blue-600 text-white rounded-lg text-xs font-bold">
                                        {selectedSessionModal.spotName}
                                    </span>
                                    <span className="text-xs text-slate-400 font-mono">
                                        {selectedSessionModal.sessionId}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-white mt-1">
                                    旅行者対話ジャーニー詳細
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    属性: {selectedSessionModal.userProfile || "(未設定)"}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedSessionModal(null)}
                                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body: Chapter Timelines */}
                        <div className="p-6 overflow-y-auto space-y-6 flex-1">
                            {(selectedSessionModal.journeyTimeline && selectedSessionModal.journeyTimeline.length > 0) ? (
                                selectedSessionModal.journeyTimeline.map((item, idx) => (
                                    <div key={idx} className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xl">{item.selectedTopic.icon}</span>
                                                <span className="text-xs font-bold text-blue-400 uppercase">
                                                    Chapter {item.chapterIndex}
                                                </span>
                                                <span className="text-sm font-bold text-white">
                                                    {item.selectedTopic.title}
                                                </span>
                                            </div>
                                            {item.isZeroLatencyPrefetched && (
                                                <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 text-[10px] font-bold rounded-md flex items-center gap-1">
                                                    <Zap className="w-3 h-3" /> 0ms即時再生
                                                </span>
                                            )}
                                        </div>

                                        {/* Presented 3 Options Before Selection */}
                                        {item.presentedOptionsBeforeSelection && item.presentedOptionsBeforeSelection.length > 0 && (
                                            <div className="p-2.5 bg-slate-900 rounded-xl text-[11px] text-slate-400 space-y-1">
                                                <p className="font-bold text-slate-500 uppercase text-[10px]">この時に提示されていた選択肢:</p>
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                                                    {item.presentedOptionsBeforeSelection.map((opt, oIdx) => (
                                                        <div
                                                            key={oIdx}
                                                            className={`p-1.5 rounded-lg border text-[11px] truncate ${
                                                                opt.title === item.selectedTopic.title
                                                                    ? "border-blue-500 bg-blue-500/20 text-blue-200 font-bold"
                                                                    : "border-slate-800 bg-slate-950 text-slate-400"
                                                            }`}
                                                        >
                                                            {opt.icon} {opt.title} {opt.title === item.selectedTopic.title && "👈 選択"}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Generated Script */}
                                        <div className="p-3 bg-slate-900/90 rounded-xl text-xs text-slate-200 leading-relaxed whitespace-pre-line border border-slate-800">
                                            {item.script}
                                        </div>

                                        {/* Chapter Feedback */}
                                        {selectedSessionModal.chapterFeedbacks?.[`chapter-${item.chapterIndex}`] && (
                                            <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                                <span>ユーザー評価:</span>
                                                {selectedSessionModal.chapterFeedbacks[`chapter-${item.chapterIndex}`] === "good" ? (
                                                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                                                        <ThumbsUp className="w-3 h-3" /> Good (役に立った)
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-500 flex items-center gap-1">
                                                        <ThumbsDown className="w-3 h-3" /> Bad
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-slate-500 text-xs py-8">
                                    このセッションには詳細なチャプター履歴がまだありません。
                                </p>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex justify-end">
                            <button
                                onClick={() => setSelectedSessionModal(null)}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors"
                            >
                                閉じる
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
