"use client";

import { useState, useEffect } from "react";
import { User, Sparkles, X, Check } from "lucide-react";

interface TagItem {
    label: string;
    value: string;
}

interface UserProfileCardProps {
    language?: string;
}

const PRESET_TAGS_MAP: Record<string, TagItem[]> = {
    en: [
        { label: "🏮 History & Tradition", value: "Loves in-depth history and cultural traditions" },
        { label: "🍜 Local Food & Snacks", value: "Interested in local specialties and street foods" },
        { label: "📸 Photography & Views", value: "Looking for the best photo angles and scenic spots" },
        { label: "👨‍👩‍👧 Family with Kids", value: "Traveling with young kids, needs fun and easy explanations" },
        { label: "⛩️ Anime & Pop Culture", value: "Anime fan interested in real-life settings and pop culture" },
        { label: "🏛️ Architecture & Art", value: "Loves traditional craftsmanship, carpentry, and design" },
        { label: "🌿 Nature & Peaceful", value: "Prefers quiet nature, gardens, and hidden spots" },
        { label: "🔰 First time in Japan", value: "First trip to Japan, needs easy basics and local manners" },
    ],
    ja: [
        { label: "🏮 歴史・伝統", value: "歴史と伝統文化に詳しい解説が好き" },
        { label: "🍜 グルメ・食べ歩き", value: "地元グルメ・名物料理やおすすめの食べ歩きスポットに興味がある" },
        { label: "📸 写真・映え", value: "一番きれいに撮れるフォトスポットや撮影のコツを知りたい" },
        { label: "👨‍👩‍👧 子連れ家族", value: "子供と一緒に楽しめる豆知識や見どころを知りたい" },
        { label: "⛩️ アニメ・ポップ", value: "アニメや漫画の舞台・現代ポップカルチャーの視点で楽しみたい" },
        { label: "🏛️ 建築・アート", value: "伝統建築の技法やデザイン・造形美に興味がある" },
        { label: "🌿 自然・散策", value: "静かにリラックスできる自然や庭園、穴場スポットが好き" },
        { label: "🔰 初めての日本", value: "日本旅行が初めてなので分かりやすい基本情報とマナーを知りたい" },
    ],
    zh: [
        { label: "🏮 历史与传统", value: "喜欢深入了解历史背景与文化传统" },
        { label: "🍜 美食与小吃", value: "对当地特色美食及推荐小吃街感兴趣" },
        { label: "📸 摄影与拍照", value: "寻找最佳拍照打卡点与摄影技巧" },
        { label: "👨‍👩‍👧 亲子家庭", value: "带小孩出行，需要通俗有趣的内容" },
        { label: "⛩️ 动漫与流行文化", value: "动漫圣地巡礼，对现代流行文化感兴趣" },
        { label: "🏛️ 建筑与艺术", value: "对日本传统木造建筑与工匠美学感兴趣" },
        { label: "🌿 自然与散步", value: "喜欢安静的日式庭园与小众自然景点" },
        { label: "🔰 首次访日", value: "初次游览日本，希望了解基本礼仪与常识" },
    ],
    ru: [
        { label: "🏮 История и традиции", value: "Интересуется глубокой историей и культурой" },
        { label: "🍜 Еда и кулинария", value: "Любит местную кухню и гастрономические места" },
        { label: "📸 Фото и виды", value: "Ищет лучшие ракурсы для фотографий" },
        { label: "👨‍👩‍👧 Семья с детьми", value: "Путешествует с детьми, нужны простые и увлекательные факты" },
        { label: "⛩️ Аниме и поп-культура", value: "Любитель аниме и современной поп-культуры" },
        { label: "🏛️ Архитектура", value: "Интересуется традиционным зодчеством и ремеслом" },
        { label: "🌿 Природа и сады", value: "Предпочитает тихие парки и скрытые уголки" },
        { label: "🔰 Первый раз в Японии", value: "Впервые в Японии, нужны полезные советы и этикет" },
    ],
};

const UI_TEXTS: Record<string, { title: string; desc: string; placeholder: string; tagHint: string; save: string }> = {
    en: {
        title: "Your Travel Profile",
        desc: "AI customizes the narrative perspective based on your personal traits.",
        placeholder: "e.g. Traveling with kids. Loves anime and Japanese sweets / Solo trip interested in history and zen...",
        tagHint: "Tap quick tags to add or remove traits:",
        save: "Saved",
    },
    ja: {
        title: "旅行者の属性・趣向 (Traveler Profile)",
        desc: "設定した属性に合わせて、AIがガイドの切り口や視点を変えて案内します。",
        placeholder: "例: 小学生の子供連れの家族旅行。アニメと甘いものが好き / 建築と歴史に興味がある一人旅...",
        tagHint: "タップで追加・解除できるクイックタグ:",
        save: "保存完了",
    },
    zh: {
        title: "旅行者偏好设定",
        desc: "AI将根据您的个人背景与偏好，定制专属视角与讲解风格。",
        placeholder: "例如：带小学生的家庭旅行，喜欢动漫和甜点 / 独自探索历史建筑与禅宗文化...",
        tagHint: "点击快速标签进行添加或取消：",
        save: "已保存",
    },
    ru: {
        title: "Ваш профиль путешественника",
        desc: "ИИ адаптирует стиль повествования под ваши интересы и состав группы.",
        placeholder: "Например: Семья с детьми, любим аниме / Одиночное путешествие, интерес к истории и архитектуре...",
        tagHint: "Быстрые теги для выбора:",
        save: "Сохранено",
    },
};

export default function UserProfileCard({ language = "en" }: UserProfileCardProps) {
    const [profile, setProfile] = useState("");
    const [isSaved, setIsSaved] = useState(false);
    const [currentLanguage, setCurrentLanguage] = useState(language);

    useEffect(() => {
        const savedProfile = localStorage.getItem("ai_audio_guide_user_profile");
        if (savedProfile) {
            setProfile(savedProfile);
        }
    }, []);

    useEffect(() => {
        if (language) {
            setCurrentLanguage(language);
        } else {
            const savedLang = localStorage.getItem("ai_guide_language");
            if (savedLang) {
                setCurrentLanguage(savedLang);
            }
        }
    }, [language]);

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
            newProfile = newProfile
                .replace(tagValue, "")
                .replace(/^、|、$/g, "")
                .replace(/、、/g, "、")
                .trim();
        } else {
            newProfile = `${newProfile}、${tagValue}`;
        }
        updateProfile(newProfile);
    };

    const t = UI_TEXTS[currentLanguage] || UI_TEXTS.en;
    const tags = PRESET_TAGS_MAP[currentLanguage] || PRESET_TAGS_MAP.en;

    return (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-neutral-200/80 mb-8 transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5 text-neutral-900">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                        <User className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-neutral-900">{t.title}</h2>
                        <p className="text-xs text-neutral-500">
                            {t.desc}
                        </p>
                    </div>
                </div>
                {isSaved && (
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1 animate-in fade-in">
                        <Check className="w-3.5 h-3.5" /> {t.save}
                    </span>
                )}
            </div>

            {/* Input Area */}
            <div className="relative mt-2">
                <textarea
                    value={profile}
                    onChange={(e) => updateProfile(e.target.value)}
                    placeholder={t.placeholder}
                    rows={2}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                />
                {profile && (
                    <button
                        onClick={() => updateProfile("")}
                        className="absolute top-2.5 right-2.5 text-neutral-400 hover:text-neutral-600 p-1"
                        title="Clear"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Quick Preset Tags */}
            <div className="mt-3">
                <p className="text-xs font-semibold text-neutral-400 mb-2 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    {t.tagHint}
                </p>
                <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag, idx) => {
                        const isSelected = profile.includes(tag.value);
                        return (
                            <button
                                key={idx}
                                onClick={() => handleTagClick(tag.value)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                                    isSelected
                                        ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                                        : "bg-neutral-50 text-neutral-600 border-neutral-200/80 hover:bg-neutral-100 hover:border-neutral-300"
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
