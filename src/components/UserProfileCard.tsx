"use client";

import { useState, useEffect } from "react";
import { User, Sparkles, X, Check } from "lucide-react";

const PRESET_TAGS = [
    { label: "🏮 歴史・伝統", value: "歴史と伝統文化に詳しい解説が好き" },
    { label: "🍜 グルメ・食べ歩き", value: "地元グルメ・名物料理やおすすめの食べ歩きスポットに興味がある" },
    { label: "📸 写真・映え", value: "一番きれいに撮れるフォトスポットや撮影のコツを知りたい" },
    { label: "👨‍👩‍👧 子連れ家族", value: "子供と一緒に楽しめる豆知識や見どころを知りたい" },
    { label: "⛩️ アニメ・ポップ", value: "アニメや漫画の舞台・現代ポップカルチャーの視点で楽しみたい" },
    { label: "🏛️ 建築・アート", value: "伝統建築の技法やデザイン・造形美に興味がある" },
    { label: "🌿 自然・散策", value: "静かにリラックスできる自然や庭園、穴場スポットが好き" },
    { label: "🔰 初めての日本", value: "日本旅行が初めてなので分かりやすい基本情報とマナーを知りたい" },
];

export default function UserProfileCard() {
    const [profile, setProfile] = useState("");
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem("ai_audio_guide_user_profile");
        if (saved) {
            setProfile(saved);
        }
    }, []);

    const updateProfile = (value: string) => {
        setProfile(value);
        localStorage.setItem("ai_audio_guide_user_profile", value);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    const handleTagClick = (tagValue: string) => {
        let newProfile = profile.trim();
        if (!newProfile) {
            newProfile = tagValue;
        } else if (newProfile.includes(tagValue)) {
            // Remove tag if already in profile
            newProfile = newProfile
                .replace(tagValue, "")
                .replace(/^、|、$/g, "")
                .replace(/、、/g, "、")
                .trim();
        } else {
            // Append tag
            newProfile = `${newProfile}、${tagValue}`;
        }
        updateProfile(newProfile);
    };

    return (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-neutral-200/80 mb-8 transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5 text-neutral-900">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                        <User className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-neutral-900">Your Travel Profile (旅行者の属性・趣向)</h2>
                        <p className="text-xs text-neutral-500">
                            設定した属性に合わせて、AIがガイドの切り口や視点を変えて案内します
                        </p>
                    </div>
                </div>
                {isSaved && (
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1 animate-in fade-in">
                        <Check className="w-3.5 h-3.5" /> 保存
                    </span>
                )}
            </div>

            {/* Input Area */}
            <div className="relative mt-2">
                <textarea
                    value={profile}
                    onChange={(e) => updateProfile(e.target.value)}
                    placeholder="例: 小学生の子供連れの家族旅行。アニメと甘いものが好き / 建築と歴史に興味がある一人旅..."
                    rows={2}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                />
                {profile && (
                    <button
                        onClick={() => updateProfile("")}
                        className="absolute top-2.5 right-2.5 text-neutral-400 hover:text-neutral-600 p-1"
                        title="クリア"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Quick Preset Tags */}
            <div className="mt-3">
                <p className="text-xs font-semibold text-neutral-400 mb-2 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    タップで追加・解除できるクイックタグ:
                </p>
                <div className="flex flex-wrap gap-1.5">
                    {PRESET_TAGS.map((tag) => {
                        const isSelected = profile.includes(tag.value);
                        return (
                            <button
                                key={tag.label}
                                onClick={() => handleTagClick(tag.value)}
                                className={`text-xs px-3 py-1.5 rounded-xl border transition-all font-medium ${
                                    isSelected
                                        ? "border-blue-600 bg-blue-50 text-blue-600 font-bold"
                                        : "border-neutral-200 bg-neutral-50/50 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-100"
                                }`}
                            >
                                {tag.label}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
