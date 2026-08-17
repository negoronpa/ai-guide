"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
    Activity,
    ArrowLeft,
    Calendar,
    Search,
    Download,
    FileText,
    Filter,
    CheckSquare,
    Square,
    RefreshCw,
    Play,
    Compass,
    ThumbsUp,
    ThumbsDown,
    X,
    ExternalLink,
    ChevronDown,
    ChevronUp,
    Database,
    Zap,
    Tag,
    Layers,
    User,
    CheckCircle2,
    SlidersHorizontal,
    Sparkles
} from "lucide-react";
import { FullSessionLog, generateSessionLogsCsv } from "@/lib/analyticsStore";

export default function SessionLogsSearchPage() {
    const [sessions, setSessions] = useState<FullSessionLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [selectedSessionIds, setSelectedSessionIds] = useState<Set<string>>(new Set());
    const [activeDetailModal, setActiveDetailModal] = useState<FullSessionLog | null>(null);

    // Search & Filter States
    const [searchKeyword, setSearchKeyword] = useState(""); // 属性・プロファイル・IDフリーワード
    const [selectedSpotFilter, setSelectedSpotFilter] = useState("all");
    const [selectedLanguageFilter, setSelectedLanguageFilter] = useState("all");
    const [depthFilter, setDepthFilter] = useState<"all" | "1" | "2-4" | "5+">("all");
    const [feedbackFilter, setFeedbackFilter] = useState<"all" | "has_feedback" | "respect" | "discovery" | "needs_improvement" | "has_good" | "has_bad">("all");
    const [datePreset, setDatePreset] = useState<"today" | "7d" | "30d" | "all" | "custom">("all");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    const fetchSessions = async () => {
        setIsRefreshing(true);
        try {
            const res = await fetch("/api/analytics?type=sessions");
            if (res.ok) {
                const data = await res.json();
                setSessions(data.sessions || []);
            }
        } catch (e) {
            console.error("Failed to fetch sessions:", e);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    // Filter Logic
    const filteredSessions = useMemo(() => {
        return sessions.filter((s) => {
            // 1. Keyword search (User Profile, Session ID, Spot Name)
            if (searchKeyword.trim()) {
                const q = searchKeyword.toLowerCase();
                const matchKeyword =
                    (s.userProfile || "").toLowerCase().includes(q) ||
                    s.spotName.toLowerCase().includes(q) ||
                    s.sessionId.toLowerCase().includes(q);
                if (!matchKeyword) return false;
            }

            // 2. Spot filter
            if (selectedSpotFilter !== "all" && s.spotId !== selectedSpotFilter) {
                return false;
            }

            // 3. Language filter
            if (selectedLanguageFilter !== "all" && s.language !== selectedLanguageFilter) {
                return false;
            }

            // 4. Depth filter (Chapter Count)
            if (depthFilter === "1" && s.totalChapters !== 1) return false;
            if (depthFilter === "2-4" && (s.totalChapters < 2 || s.totalChapters > 4)) return false;
            if (depthFilter === "5+" && s.totalChapters < 5) return false;

            // 5. Feedback filter
            if (feedbackFilter === "has_feedback") {
                const hasOverall = Boolean(s.overallFeedback);
                const hasChapterFb = s.chapterFeedbacks && Object.keys(s.chapterFeedbacks).length > 0;
                if (!hasOverall && !hasChapterFb) return false;
            } else if (feedbackFilter === "respect" && s.overallFeedback !== "respect") {
                return false;
            } else if (feedbackFilter === "discovery" && s.overallFeedback !== "discovery") {
                return false;
            } else if (feedbackFilter === "needs_improvement" && s.overallFeedback !== "needs_improvement") {
                return false;
            } else if (feedbackFilter === "has_good") {
                const hasGood = s.chapterFeedbacks && Object.values(s.chapterFeedbacks).some((v) => v === "good");
                if (!hasGood) return false;
            } else if (feedbackFilter === "has_bad") {
                const hasBad = s.chapterFeedbacks && Object.values(s.chapterFeedbacks).some((v) => v === "bad");
                if (!hasBad) return false;
            }

            // 6. Date Range filter
            const created = new Date(s.createdAt).getTime();
            const now = Date.now();
            if (datePreset === "today") {
                const startOfToday = new Date().setHours(0, 0, 0, 0);
                if (created < startOfToday) return false;
            } else if (datePreset === "7d") {
                if (created < now - 7 * 24 * 60 * 60 * 1000) return false;
            } else if (datePreset === "30d") {
                if (created < now - 30 * 24 * 60 * 60 * 1000) return false;
            } else if (datePreset === "custom") {
                if (dateFrom && created < new Date(dateFrom).getTime()) return false;
                if (dateTo && created > new Date(dateTo).setHours(23, 59, 59, 999)) return false;
            }

            return true;
        });
    }, [
        sessions,
        searchKeyword,
        selectedSpotFilter,
        selectedLanguageFilter,
        depthFilter,
        feedbackFilter,
        datePreset,
        dateFrom,
        dateTo,
    ]);

    // Checkbox Selection Helpers
    const isAllSelected = filteredSessions.length > 0 && filteredSessions.every((s) => selectedSessionIds.has(s.sessionId));
    const isSomeSelected = filteredSessions.some((s) => selectedSessionIds.has(s.sessionId)) && !isAllSelected;

    const toggleSelectAll = () => {
        if (isAllSelected) {
            const next = new Set(selectedSessionIds);
            filteredSessions.forEach((s) => next.delete(s.sessionId));
            setSelectedSessionIds(next);
        } else {
            const next = new Set(selectedSessionIds);
            filteredSessions.forEach((s) => next.add(s.sessionId));
            setSelectedSessionIds(next);
        }
    };

    const toggleSelectSession = (sessionId: string) => {
        const next = new Set(selectedSessionIds);
        if (next.has(sessionId)) {
            next.delete(sessionId);
        } else {
            next.add(sessionId);
        }
        setSelectedSessionIds(next);
    };

    // Download Selected Sessions as CSV
    const handleDownloadSelectedCsv = () => {
        const targetSessions = selectedSessionIds.size > 0
            ? sessions.filter((s) => selectedSessionIds.has(s.sessionId))
            : filteredSessions;

        if (targetSessions.length === 0) {
            alert("ダウンロード対象のセッションが選択されていません。");
            return;
        }

        const csv = generateSessionLogsCsv(targetSessions);
        const blob = new Blob([csv], { type: "text/csv; charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `selected_ai_guide_logs_${targetSessions.length}items_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Download Selected Sessions as JSON
    const handleDownloadSelectedJson = () => {
        const targetSessions = selectedSessionIds.size > 0
            ? sessions.filter((s) => selectedSessionIds.has(s.sessionId))
            : filteredSessions;

        if (targetSessions.length === 0) {
            alert("ダウンロード対象のセッションが選択されていません。");
            return;
        }

        const jsonStr = JSON.stringify(targetSessions, null, 2);
        const blob = new Blob([jsonStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `selected_ai_guide_logs_${targetSessions.length}items_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Spot unique list for filter dropdown
    const availableSpots = useMemo(() => {
        const map = new Map<string, string>();
        sessions.forEach((s) => {
            if (s.spotId && s.spotName) map.set(s.spotId, s.spotName);
        });
        return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
    }, [sessions]);

    return (
        <main className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header with Navigation */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <Link
                                href="/analytics"
                                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-colors"
                                title="ダッシュボードへ戻る"
                            >
                                <ArrowLeft className="w-4 h-4" />
                            </Link>
                            <div className="flex items-center gap-2">
                                <Search className="w-6 h-6 text-blue-400" />
                                <h1 className="text-2xl font-bold text-white tracking-tight">
                                    実証実験 セッションログ検索 ＆ 選択エクスポート
                                </h1>
                            </div>
                        </div>
                        <p className="text-xs text-slate-400 pl-11">
                            会話ごとの生成日・属性・到達深度・Good/Bad回数・フィードバックを条件検索し、選択して一括ダウンロード
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={fetchSessions}
                            disabled={isRefreshing}
                            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-blue-400" : ""}`} />
                            最新データ取得
                        </button>
                        <Link
                            href="/analytics"
                            className="px-3.5 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded-xl text-xs font-semibold border border-blue-500/30 transition-colors"
                        >
                            📊 KPIダッシュボード
                        </Link>
                    </div>
                </div>

                {/* ========================================================================= */}
                {/* 🔍 Multi-Condition Search & Filter Controls */}
                {/* ========================================================================= */}
                <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-5 shadow-lg space-y-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-white pb-2 border-b border-slate-700/60">
                        <SlidersHorizontal className="w-4 h-4 text-blue-400" />
                        <span>検索・絞り込みフィルター</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {/* 1. Keyword (Persona / ID / Spot) */}
                        <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                属性 (ペルソナ) / ID 検索
                            </label>
                            <div className="relative">
                                <User className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchKeyword}
                                    onChange={(e) => setSearchKeyword(e.target.value)}
                                    placeholder="例: 浪人生 / 子連れ / 建築..."
                                    className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>

                        {/* 2. Spot Dropdown */}
                        <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                観光スポット
                            </label>
                            <select
                                value={selectedSpotFilter}
                                onChange={(e) => setSelectedSpotFilter(e.target.value)}
                                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                            >
                                <option value="all">全スポット (すべて)</option>
                                {availableSpots.map((spot) => (
                                    <option key={spot.id} value={spot.id}>
                                        {spot.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* 3. Depth (Chapter Count) */}
                        <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                到達したチャプター深度
                            </label>
                            <select
                                value={depthFilter}
                                onChange={(e) => setDepthFilter(e.target.value as any)}
                                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                            >
                                <option value="all">すべての深さ (全件)</option>
                                <option value="1">Chapter 1 のみ (離脱)</option>
                                <option value="2-4">Chapter 2〜4 (中間深掘り)</option>
                                <option value="5+">Chapter 5以上 (深い学び・敬意)</option>
                            </select>
                        </div>

                        {/* 4. Feedback Condition */}
                        <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                フィードバック・評価
                            </label>
                            <select
                                value={feedbackFilter}
                                onChange={(e) => setFeedbackFilter(e.target.value as any)}
                                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                            >
                                <option value="all">すべての評価 (無条件)</option>
                                <option value="has_feedback">フィードバック回答あり</option>
                                <option value="respect">✨ 歴史に感動 (Respect)</option>
                                <option value="discovery">💡 新しい発見 (Discovery)</option>
                                <option value="needs_improvement">🤔 難しかった (Improvement)</option>
                                <option value="has_good">👍 Good 評価を含む</option>
                                <option value="has_bad">👎 Bad 評価を含む</option>
                            </select>
                        </div>
                    </div>

                    {/* Date Presets & Custom Range */}
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-700/60">
                        <div className="flex flex-wrap items-center gap-1.5 text-xs">
                            <span className="text-slate-400 mr-1 flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" /> 期間:
                            </span>
                            {(["all", "today", "7d", "30d", "custom"] as const).map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setDatePreset(p)}
                                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                                        datePreset === p
                                            ? "bg-blue-600 text-white shadow-xs"
                                            : "bg-slate-900 text-slate-400 hover:text-white"
                                    }`}
                                >
                                    {p === "all" ? "全期間" : p === "today" ? "今日" : p === "7d" ? "過去7日" : p === "30d" ? "過去30日" : "指定"}
                                </button>
                            ))}

                            {datePreset === "custom" && (
                                <div className="flex items-center gap-1.5 ml-2">
                                    <input
                                        type="date"
                                        value={dateFrom}
                                        onChange={(e) => setDateFrom(e.target.value)}
                                        className="px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                                    />
                                    <span className="text-slate-400">〜</span>
                                    <input
                                        type="date"
                                        value={dateTo}
                                        onChange={(e) => setDateTo(e.target.value)}
                                        className="px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Reset Filter Button */}
                        <button
                            onClick={() => {
                                setSearchKeyword("");
                                setSelectedSpotFilter("all");
                                setSelectedLanguageFilter("all");
                                setDepthFilter("all");
                                setFeedbackFilter("all");
                                setDatePreset("all");
                                setDateFrom("");
                                setDateTo("");
                            }}
                            className="text-xs text-slate-400 hover:text-white underline"
                        >
                            フィルターをクリア
                        </button>
                    </div>
                </div>

                {/* ========================================================================= */}
                {/* 📥 Action Bar: Selection Count & Download Buttons */}
                {/* ========================================================================= */}
                <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
                    <div className="flex items-center gap-3 text-xs">
                        <button
                            onClick={toggleSelectAll}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-700 rounded-xl text-slate-300 font-semibold border border-slate-700 transition-colors"
                        >
                            {isAllSelected ? (
                                <CheckSquare className="w-4 h-4 text-blue-400" />
                            ) : isSomeSelected ? (
                                <div className="w-4 h-4 bg-blue-500/40 rounded flex items-center justify-center text-[10px] font-bold text-white">−</div>
                            ) : (
                                <Square className="w-4 h-4 text-slate-500" />
                            )}
                            <span>{isAllSelected ? "すべて解除" : "全件選択"}</span>
                        </button>
                        <span className="text-slate-400">
                            該当: <strong className="text-white font-mono">{filteredSessions.length}</strong> 件中、
                            選択: <strong className="text-blue-400 font-mono text-sm">{selectedSessionIds.size}</strong> 件
                        </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={handleDownloadSelectedCsv}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95"
                        >
                            <Download className="w-4 h-4" />
                            {selectedSessionIds.size > 0
                                ? `選択した ${selectedSessionIds.size} 件をCSVダウンロード`
                                : `検索結果 ${filteredSessions.length} 件をCSVダウンロード`}
                        </button>
                        <button
                            onClick={handleDownloadSelectedJson}
                            className="px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 border border-slate-600 transition-all active:scale-95"
                        >
                            <FileText className="w-4 h-4 text-blue-400" />
                            {selectedSessionIds.size > 0
                                ? `選択 ${selectedSessionIds.size} 件 JSON`
                                : `全 ${filteredSessions.length} 件 JSON`}
                        </button>
                    </div>
                </div>

                {/* ========================================================================= */}
                {/* 📋 Sessions Table with Checkboxes */}
                {/* ========================================================================= */}
                <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-slate-700 bg-slate-950/50 text-slate-400 font-bold uppercase tracking-wider">
                                    <th className="py-3.5 px-3 text-center w-10">選択</th>
                                    <th className="py-3.5 px-3">生成日時 / セッションID</th>
                                    <th className="py-3.5 px-4">観光スポット</th>
                                    <th className="py-3.5 px-4">旅行者属性 (ペルソナ)</th>
                                    <th className="py-3.5 px-3 text-center">到達深度</th>
                                    <th className="py-3.5 px-3 text-center">Good / Bad</th>
                                    <th className="py-3.5 px-3 text-center">学び評価</th>
                                    <th className="py-3.5 px-4 text-right">詳細</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/80">
                                {filteredSessions.length > 0 ? (
                                    filteredSessions.map((s) => {
                                        const isSelected = selectedSessionIds.has(s.sessionId);
                                        const goodCount = s.chapterFeedbacks
                                            ? Object.values(s.chapterFeedbacks).filter((v) => v === "good").length
                                            : 0;
                                        const badCount = s.chapterFeedbacks
                                            ? Object.values(s.chapterFeedbacks).filter((v) => v === "bad").length
                                            : 0;

                                        return (
                                            <tr
                                                key={s.sessionId}
                                                className={`transition-colors ${
                                                    isSelected ? "bg-blue-600/10 hover:bg-blue-600/15" : "hover:bg-slate-800/60"
                                                }`}
                                            >
                                                {/* Checkbox */}
                                                <td className="py-3.5 px-3 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => toggleSelectSession(s.sessionId)}
                                                        className="w-4 h-4 text-blue-600 bg-slate-900 border-slate-700 rounded focus:ring-blue-500 cursor-pointer"
                                                    />
                                                </td>

                                                {/* Date & ID */}
                                                <td className="py-3.5 px-3 font-mono text-slate-400">
                                                    <div className="font-semibold text-slate-200">
                                                        {new Date(s.createdAt).toLocaleString("ja-JP", {
                                                            year: "numeric",
                                                            month: "2-digit",
                                                            day: "2-digit",
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                            second: "2-digit",
                                                        })}
                                                    </div>
                                                    <div className="text-[10px] text-slate-500 truncate max-w-[130px]" title={s.sessionId}>
                                                        {s.sessionId}
                                                    </div>
                                                </td>

                                                {/* Spot Name */}
                                                <td className="py-3.5 px-4 font-bold text-white">
                                                    <div className="flex items-center gap-1.5">
                                                        <span>{s.spotName}</span>
                                                        <span className="text-[10px] px-1.5 py-0.2 bg-slate-700 text-slate-300 rounded font-semibold uppercase">
                                                            {s.language}
                                                        </span>
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 font-normal">{s.spotLocation}</div>
                                                </td>

                                                {/* User Profile */}
                                                <td className="py-3.5 px-4 text-slate-300 max-w-[260px]">
                                                    <p className="line-clamp-2 leading-relaxed" title={s.userProfile}>
                                                        {s.userProfile ? (
                                                            s.userProfile
                                                        ) : (
                                                            <span className="text-slate-500 italic">属性未設定</span>
                                                        )}
                                                    </p>
                                                </td>

                                                {/* Depth (Chapter Count) */}
                                                <td className="py-3.5 px-3 text-center">
                                                    <span
                                                        className={`px-2.5 py-1 rounded-full text-xs font-extrabold font-mono inline-block ${
                                                            s.totalChapters >= 5
                                                                ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                                                : s.totalChapters >= 2
                                                                ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                                                : "bg-slate-700 text-slate-400"
                                                        }`}
                                                    >
                                                        {s.totalChapters} 章
                                                    </span>
                                                </td>

                                                {/* Good / Bad Count */}
                                                <td className="py-3.5 px-3 text-center font-mono">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                                                            <ThumbsUp className="w-3 h-3" /> {goodCount}
                                                        </span>
                                                        <span className="text-slate-500 flex items-center gap-0.5">
                                                            <ThumbsDown className="w-3 h-3" /> {badCount}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Learning Reflection Feedback */}
                                                <td className="py-3.5 px-3 text-center">
                                                    {s.overallFeedback === "respect" ? (
                                                        <span className="px-2.5 py-1 bg-orange-500/20 text-orange-300 rounded-xl font-bold text-xs inline-flex items-center gap-1 border border-orange-500/30">
                                                            ✨ 歴史に感動
                                                        </span>
                                                    ) : s.overallFeedback === "discovery" ? (
                                                        <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 rounded-xl font-bold text-xs inline-flex items-center gap-1 border border-amber-500/30">
                                                            💡 新しい発見
                                                        </span>
                                                    ) : s.overallFeedback === "needs_improvement" ? (
                                                        <span className="px-2 py-0.5 bg-slate-700 text-slate-400 rounded-lg text-[11px]">
                                                            🤔 難しかった
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-600">-</span>
                                                    )}
                                                </td>

                                                {/* Detail Action */}
                                                <td className="py-3.5 px-4 text-right">
                                                    <button
                                                        onClick={() => setActiveDetailModal(s)}
                                                        className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white rounded-xl font-bold text-xs transition-colors inline-flex items-center gap-1"
                                                    >
                                                        <span>詳細</span>
                                                        <ChevronDown className="w-3.5 h-3.5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={8} className="py-12 text-center text-slate-500 space-y-2">
                                            <p className="text-sm font-semibold">条件に一致するセッションログが見つかりませんでした。</p>
                                            <p className="text-xs text-slate-600">検索フィルターの条件を緩和するか、新しい音声ガイドを体験してみてください。</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ========================================================================= */}
            {/* 🔍 Session Detail Journey Modal */}
            {/* ========================================================================= */}
            {activeDetailModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 p-4 flex items-center justify-center animate-in fade-in">
                    <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                        {/* Header: Persona & Spot Summary */}
                        <div className="p-6 border-b border-slate-800 bg-slate-950/70 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-xs font-extrabold">
                                        {activeDetailModal.spotName}
                                    </span>
                                    <span className="text-xs text-slate-400 font-mono">
                                        {activeDetailModal.sessionId}
                                    </span>
                                </div>
                                <button
                                    onClick={() => setActiveDetailModal(null)}
                                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Visitor Persona & Initial Choice Badge */}
                            <div className="p-3 bg-slate-900/90 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                                <div>
                                    <span className="text-slate-400">👤 旅行者属性 (ペルソナ): </span>
                                    <strong className="text-slate-200">
                                        {activeDetailModal.userProfile || "属性未設定"}
                                    </strong>
                                </div>
                                <div>
                                    <span className="text-slate-400">🎯 初回選択テーマ: </span>
                                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded font-semibold">
                                        {activeDetailModal.initialChoice || (activeDetailModal.interests && activeDetailModal.interests.length > 0 ? activeDetailModal.interests.join(" / ") : "✨ おすすめハイライト")}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Body: Step-by-Step Chronological Interaction Journey */}
                        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-900/50">
                            {activeDetailModal.journeyTimeline && activeDetailModal.journeyTimeline.length > 0 ? (
                                activeDetailModal.journeyTimeline.map((item, idx) => {
                                    const chapterNum = item.chapterIndex || (idx + 1);
                                    const isChapter1 = chapterNum === 1;
                                    const isFeedbackHere = activeDetailModal.overallFeedbackChapter === chapterNum || (idx === (activeDetailModal.journeyTimeline?.length || 1) - 1 && activeDetailModal.overallFeedback && !activeDetailModal.overallFeedbackChapter);

                                    return (
                                        <div key={idx} className="space-y-4">
                                            {/* Chapter Container */}
                                            <div className="p-4 bg-slate-950/90 border border-slate-800 rounded-2xl space-y-3.5 shadow-md">
                                                {/* Step Header */}
                                                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs px-2.5 py-1 bg-slate-800 text-blue-300 font-extrabold rounded-lg font-mono">
                                                            Chapter {chapterNum}
                                                        </span>
                                                        <span className="text-sm font-bold text-white">
                                                            {isChapter1 ? (
                                                                <span>🎙️ 初期AI音声ガイド ({activeDetailModal.initialChoice || "おすすめハイライト"})</span>
                                                            ) : (
                                                                <span>👉 ユーザー選択: {item.selectedTopic?.icon} {item.selectedTopic?.title}</span>
                                                            )}
                                                        </span>
                                                    </div>
                                                    {item.isZeroLatencyPrefetched && (
                                                        <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 text-[10px] font-bold rounded-md flex items-center gap-1">
                                                            <Zap className="w-3 h-3" /> 0ms即時再生
                                                        </span>
                                                    )}
                                                </div>

                                                {/* AI Generated Guide Audio Script */}
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                                        🔊 AI音声ガイド内容 (スクリプト):
                                                    </p>
                                                    <div className="p-3.5 bg-slate-900 rounded-xl text-xs text-slate-200 leading-relaxed whitespace-pre-line border border-slate-800">
                                                        {item.script}
                                                    </div>
                                                </div>

                                                {/* Presented Options in this Chapter */}
                                                {item.presentedOptionsBeforeSelection && item.presentedOptionsBeforeSelection.length > 0 && (
                                                    <div className="p-2.5 bg-slate-900/80 rounded-xl text-[11px] text-slate-400 space-y-1.5 border border-slate-800/60">
                                                        <p className="font-bold text-slate-400 text-[10px]">
                                                            💡 画面に提示された次の3つの選択肢:
                                                        </p>
                                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                                                            {item.presentedOptionsBeforeSelection.map((opt, oIdx) => (
                                                                <div
                                                                    key={oIdx}
                                                                    className="p-2 rounded-lg border border-slate-800 bg-slate-950 text-slate-300 text-[11px] truncate"
                                                                >
                                                                    {opt.icon} {opt.title}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Chapter Good / Bad Reaction */}
                                                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <span>Good / Bad 入力有無:</span>
                                                        {activeDetailModal.chapterFeedbacks?.[`chapter-${chapterNum}`] === "good" ? (
                                                            <span className="text-emerald-400 font-bold flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                                                                <ThumbsUp className="w-3 h-3" /> Good (有益)
                                                            </span>
                                                        ) : activeDetailModal.chapterFeedbacks?.[`chapter-${chapterNum}`] === "bad" ? (
                                                            <span className="text-red-400 font-bold flex items-center gap-1 bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/20">
                                                                <ThumbsDown className="w-3 h-3" /> Bad (不評)
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-500 italic">未入力</span>
                                                        )}
                                                    </div>
                                                    <span className="text-[10px] text-slate-500 font-mono">
                                                        {item.timestamp ? new Date(item.timestamp).toLocaleTimeString("ja-JP") : ""}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Overall Feedback Box inserted at the exact timing it was submitted */}
                                            {isFeedbackHere && activeDetailModal.overallFeedback && (
                                                <div className="p-3.5 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between text-xs animate-in fade-in">
                                                    <div className="flex items-center gap-2">
                                                        <Sparkles className="w-4 h-4 text-amber-400" />
                                                        <div>
                                                            <span className="text-slate-400">✨ このタイミングで得られた全体の学びフィードバック: </span>
                                                            <strong className="text-amber-300 font-bold ml-1">
                                                                {activeDetailModal.overallFeedback === "respect"
                                                                    ? "歴史への敬意・感動 (Respect)"
                                                                    : activeDetailModal.overallFeedback === "discovery"
                                                                    ? "新しい発見 (Discovery)"
                                                                    : "難しかった (Needs Improvement)"}
                                                            </strong>
                                                        </div>
                                                    </div>
                                                    <span className="text-[10px] text-slate-400 font-mono">
                                                        {activeDetailModal.overallFeedbackTimestamp ? new Date(activeDetailModal.overallFeedbackTimestamp).toLocaleTimeString("ja-JP") : ""}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            ) : (
                                <p className="text-center text-slate-500 text-xs py-8">
                                    詳細なチャプター履歴がありません。
                                </p>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
                            <span className="text-xs text-slate-400 font-mono">
                                累計チャプター数: <strong className="text-white">{activeDetailModal.totalChapters} 章</strong>
                            </span>
                            <button
                                onClick={() => setActiveDetailModal(null)}
                                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors"
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
