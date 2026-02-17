# Vercel デプロイ手順書

このアプリを Vercel に公開するための手順です。

## 1. 準備：GitHub へのプッシュ
Vercel は GitHub リポジトリと連携するのが最も簡単で推奨される方法です。

1.  GitHub で新しいリポジトリを作成します（例：`ai-audio-guide`）。
2.  ローカルのソースコードを GitHub にプッシュします。
    ```bash
    git init
    git add .
    git commit -m "Initial commit: AI Audio Guide MVP"
    git branch -M main
    git remote add origin https://github.com/あなたのユーザー名/ai-audio-guide.git
    git push -u origin main
    ```

## 2. Vercel でのデプロイ設定
1.  [Vercel](https://vercel.com/) にログインし、「Add New」>「Project」をクリックします。
2.  先ほどプッシュした GitHub リポジトリをインポートします。
3.  **重要：Environment Variables（環境変数）の設定**
    「Environment Variables」セクションで、`.env.local` に記載している以下の2つのキーを追加してください：
    - `GOOGLE_GENERATIVE_AI_API_KEY`: (あなたのGemini APIキー)
    - `OPENAI_API_KEY`: (あなたのOpenAI APIキー)
4.  「Deploy」ボタンをクリックします。

## 3. 公開後の確認
- デプロイが完了すると `https://リポジトリ名.vercel.app` のような URL が発行されます。
- スマートフォンでその URL にアクセスし、実際に音声が流れるか確認しましょう！

## 注意事項
- **APIキーのセキュリティ**: GitHub にプッシュする際、`.gitignore` に `.env.local` が含まれていることを必ず確認してください（Next.js のデフォルト設定では含まれています）。
- **従量課金**: 公開後は誰でも利用可能になるため、API の使用量（特に OpenAI）には十分ご注意ください。
