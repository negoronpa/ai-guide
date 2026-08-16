# AI インタラクティブ音声ガイド 基本設計書 (Basic Design Specification)

---

## 1. システム概要と開発背景

### 1.1 プロジェクトの目的
本システム（**Inbound AI Audio Guide**）は、訪日外国人観光客および国内旅行者に対し、**「旅行者一人ひとりの属性・価値観・認知スタイル」と「観光資源が持つ本質的な歴史・文化・建築的価値」をリアルタイムに翻訳・調和させ、専属のプロガイドが語りかけるような知的で没入感の高い音声ガイド体験**を提供する次世代Webアプリケーションです。

### 1.2 従来の観光ガイドの課題と解決策
| 従来の音声ガイド / AIガイドの課題 | 本システムの解決アプローチ |
|:---|:---|
| **一方通行で固定された解説**（退屈になりがち） | **多段インタラクティブ構造**（3択の深掘り選択肢 ＆ 自由質問で自律的な対話体験） |
| **ユーザーの興味に偏りすぎて本質の価値が伝わらない** | **4象限ギャップ分析**（安心・発見から入り、学び・尊敬へ導くストーリーライン） |
| **年齢や好みに合わない語り口**（12歳に難解な講釈など） | **学術見学者モデリング**に基づく「年齢適応トーン」＆「関心レンズ翻訳」 |
| **LLM特有のハルシネーション**（大会結果や年号の捏造） | **Google Search Grounding**（リアルタイムWeb検索事実確認）による一次情報担保 |
| **日本語漢字・寺社仏閣名の読み間違い**（浅草寺、雷門等） | **表示用 (`displayScript`) と音声用 (`spokenScript`) の分離** ＆ 発音辞書 |
| **タップ時の生成待ち時間（3〜5秒）** | **投機的プリフェッチ（遅延発火型）**による待ち時間0秒の即時再生 |

---

## 2. システムアーキテクチャ構成

```
                               ┌──────────────────────────────────────────────┐
                               │                 Client (Web)                 │
                               │  - Next.js 14 App Router (React, Tailwind)   │
                               │  - Speculative Prefetch Cache (In-Memory)    │
                               │  - Native HTML5 Audio Streaming Engine       │
                               └──────────────────────┬───────────────────────┘
                                                      │
                                                      │ HTTPS (JSON / MPEG Audio Stream)
                                                      ▼
                               ┌──────────────────────────────────────────────┐
                               │           Backend API Orchestrator           │
                               │  Next.js Serverless Route Handlers (/api/..) │
                               └───────┬──────────────┬──────────────┬────────┘
                                       │              │              │
                    ┌──────────────────┘              │              └──────────────────┐
                    ▼                                 ▼                                 ▼
      ┌───────────────────────────┐     ┌───────────────────────────┐     ┌───────────────────────────┐
      │   Google Gemini 2.5 Flash │     │     OpenAI Audio TTS-1    │     │     Google Places API     │
      │ - Dynamic Persona Reason  │     │ - Alloy Voice Model       │     │ - Spot Autocomplete       │
      │ - Real-time Web Grounding │     │ - Direct MP3 Audio Stream │     │ - Spot Details & Geocode  │
      │ - Multi-stage 3 Topics    │     └───────────────────────────┘     └───────────────────────────┘
      └───────────────────────────┘
```

### 2.1 技術スタック
- **フロントエンド**: Next.js 14.2.3 (App Router), React 18, Tailwind CSS, Lucide Icons, TypeScript
- **バックエンド / API**: Next.js Route Handlers (`/api/generate-audio`, `/api/autocomplete`, `/api/place-details`)
- **推論 / LLM**: Google Gemini 2.5 Flash (`@google/genai` SDK)
- **事実グラウンディング**: Google Search Grounding (`tools: [{ googleSearch: {} }]`)
- **音声合成 (TTS)**: OpenAI Audio Speech API (`model: "tts-1"`, `voice: "alloy"`)
- **観光スポット検索**: Google Places API (New Text Search & Place Details)
- **デプロイ / ホスティング**: Vercel (CI/CD via GitHub `main` branch)

---

## 3. コア機能とアルゴリズム設計

### 3.1 4象限ギャップ分析フレームワーク (4-Quadrant Insight Framework)
利用者の属性（価値観）と観光資源の属性のギャップを2軸（代替可能性 × 異質性）で分析し、段階的に解説を展開します。

```
                       【 非代替的 (Irreplaceable) 】
                                     │
                 [ 学び / Learning ] │ [ 尊敬 / Respect ]
                (非代替的 × 異質)    │ (非代替的 × 同質)
                 独自の文化的起源    │ 職人の超絶技巧
                 歴史的哲学・知恵    │ 永続する建築・精神
      ─── 異質 (Novel) ──────────────┼────────────── 同質 (Resonant) ───
                (未知・異文化)       │ (共通の共感軸)
                 [ 発見 / Discovery ]│ [ 安心 / Comfort ]
                (一般的 × 異質)      │ (一般的 × 同質)
                 視覚的な驚き        │ 親しみやすい導入
                 面白いギミック・豆知識│ 共感できる日常性
                                     │
                         【 一般的 (General) 】
```
- **序盤 (Chapter 1)**: `安心` ＋ `発見` で親しみやすさと視覚的な驚きを提供。
- **中盤〜深掘り (Chapter 2以降)**: `学び` ＋ `尊敬` へ昇華させ、観光資源の本質的価値に深い感動を生む。

---

### 3.2 学術的見学者モデリング (Academic Cognitive Visitor Modeling)
観光情報学・適応型博物館ガイド研究（PEACHプロジェクト、PIL、Veron & Levasseurモデル等）に基づき、ユーザーの属性と深掘り選択履歴から**「潜在的な認知プロファイル」**を動的に推論します。

```
[ 入力 ] ユーザープロファイル (例: 12歳、女性、映え重視) ＋ 選択されたトピック
   │
   ▼
【 STEP 1: 動的認知推論 (Dynamic Inference) 】
 1. Age & Tone Adaptation (年齢・語彙レベル適応):
    - 10〜15歳: 親しみやすくワクワクする語り口（「〜なんだよ！」「実はね…」）。難解な漢語を排除。
    - 一般大人: 丁寧で明瞭なトーン（です/ます）。
    - 専門家: 論理的で教養豊かなインサイト。
 2. Cognitive Interest Lens (関心レンズ特定):
    - 📸 [Visual / 映え・色彩・写真]
    - 📖 [Narrative / 物語・伝説]
    - ⚙️ [Structure / 建築・技術・仕組み]
    - ⛩️ [Spiritual / 歴史・信仰・本質]
 3. Heritage Translation Strategy (レンズを通した価値翻訳):
    - スポット固有の歴史・職人技（本質）を、ユーザーの関心レンズ（例: 「写真に撮ると映える秘密（大提灯の朱色、真下の龍彫刻）」）を通して100%翻訳して届ける。
```

---

### 3.3 投機的プリフェッチ・0秒再生アーキテクチャ (Speculative Prefetching)
音声再生中のアイドル時間（約30〜40秒）を活用し、次の深掘り3択を裏側で先行生成します。

```
[ ユーザー体験 ]
 音声ガイド再生開始
   │
   ├─▶ 4.5秒間 継続して再生を聴いていることを検知（遅延発火タイマー）
   │     │
   │     ▼
   │   【 バックグラウンド投機的プリフェッチ (1階層下の3択のみ) 】
   │   ・Choice 1 の解説文＆TTS音声を事前生成
   │   ・Choice 2 の解説文＆TTS音声を事前生成
   │   ・Choice 3 の解説文＆TTS音声を事前生成
   │     │
   │     ▼ キャッシュ完了（ボタンに「⚡ 即時再生」バッジ点灯）
   │
 ユーザーが気になる選択肢をタップ
   │
   ▼
 【 待ち時間 0 ms（即座）で次のチャプターを再生開始！ 】
```
- **リソース制御**: 1階層下の3択のみに限定し、画面遷移時は古いリクエストを `AbortController` で破棄。

---

### 3.4 ハルシネーション抑止と事実性保証 (Anti-Hallucination Pipeline)
- **Google Search Grounding**: Gemini 2.5 Flash が生成直前に最新Web検索を実行し、大会結果や歴史的数値を事実確認。
- **事実厳守ガードレール（STEP 0）**: 確証のない大会回数（例: 第62回大会）、試合スコア、年号などの捏造をプロンプトで厳禁化。
- **Temperature 0.3**: 創作性を抑え、事実性と一貫性を最大化。
- **一次ソース自動連携**: Google検索で実際に参照したWebサイトのタイトル・URLを抽出し、UIの「参照元・公式情報 (Sources)」に自動マージ。

---

### 3.5 日本語固有名詞・寺社仏閣の誤読防止システム (Phonetic Accuracy System)
TTS音声合成での誤読（浅草寺、雷門、仲見世、手水舎、懸造など）を100%防止するため、**表示テキストと音声合成テキストを二重化**。

```
[ バックエンド生成 ]
  ├─▶ "displayScript": 画面表示用（美しい標準漢字文、ルビ表記なし）
  └─▶ "spokenScript":  TTS音声合成用（固有名詞・寺社名をすべて平仮名展開）
                            │
                            ▼
               【 観光用語発音辞書フィルター 】
               (src/lib/pronunciationDictionary.ts)
               浅草寺 ➔ せんそうじ / 雷門 ➔ かみなりもん / 手水舎 ➔ ちょうずや
                            │
                            ▼
                     OpenAI TTS-1 音声合成 ──▶ 100%正確な発音で再生
```

---

## 4. データモデルとAPIインターフェース

### 4.1 主要データ構造

#### Spot（観光スポット）
```typescript
interface Spot {
    id: string;
    name: string;
    location: string;
    description_base: string;
    imageUrl: string;
}
```

#### GuideChapter（タイムラインチャプター）
```typescript
interface GuideChapter {
    id: string;
    title: string;
    icon: string;
    script: string;
    audioUrl: string;
    sources?: Array<{ title: string; url: string }>;
}
```

#### NextTopic（深掘り3択）
```typescript
interface NextTopic {
    id: string;
    icon: string;
    title: string;
    prompt: string;
}
```

---

### 4.2 API エンドポイント仕様 (`POST /api/generate-audio`)

- **リクエストボディ (JSON)**:
  ```json
  {
    "spot": {
      "name": "Senso-ji Temple (浅草寺)",
      "location": "Asakusa, Tokyo",
      "description_base": "..."
    },
    "language": "ja",
    "interests": ["history", "culture"],
    "userProfile": "12歳。女性。神社仏閣には興味なし。インスタ映えするスポットが知りたい。",
    "currentTopic": "雷門の提灯に隠された秘密や映えスポット"
  }
  ```
- **レスポンス (MPEG Audio Stream ＆ HTTP Headers)**:
  - **Body**: 音声バイナリ (`audio/mpeg`)
  - **Headers**:
    - `X-Script-Text`: URLエンコードされた画面表示用スクリプト (`displayScript`)
    - `X-Next-Topics`: URLエンコードされた深掘り3択JSON (`nextTopics`)
    - `X-Sources`: URLエンコードされた参照元URLリスト (`sources`)

---

## 5. OPEX（運用コスト）分析と最適化

### 5.1 1リクエストあたりのコスト構造
- **Gemini 2.5 Flash**: 入力1,000tok / 出力300tok ＝ **約 0.025 円**
- **OpenAI TTS-1**: 120〜150文字 ＝ **約 0.34 円**
- **1生成あたり合計**: **約 0.37 円**（3択プリフェッチ時：約 1.10 円）
- **Google Search Grounding**: 1日1,500クエリまで **$0（完全無料）**

### 5.2 月間アクセス規模別試算
| 規模シナリオ | 月間生成回数 | 月間想定OPEX (日本円) | Google Search 費用 |
|:---|:---:|:---:|:---:|
| **MVP / テスト検証期** | 3,000 回/月 | **約 1,100 円** | 無料枠内 ($0) |
| **初期ローンチ期** | 30,000 回/月 | **約 11,000 円** | 無料枠内 ($0) |
| **商用スケール期** | 100,000 回/月 | **約 37,000 円** | 検索キャッシュ活用で最小化 |

---

## 6. まとめと今後の拡張性
本システムは、最新のLLM推論能力、リアルタイムWebグラウンディング、学術的見学者モデリング、および投機的プリフェッチ技術を結集し、**「正確性・知的好奇心・圧倒的な操作スピード」**を極めて高い次元で融合させた設計となっています。

今後の拡張として、GPS位置情報と連動した自動再生や、多言語での音声対話入力（Voice-to-Voice）への発展が容易な疎結合アーキテクチャを実現しています。
