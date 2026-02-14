# Handoff Baseline (2026-02-14)

次タスク開始時に保持すべき、サービス共通の前提情報。

## 1) 本番環境の基本

- Frontend: `https://www.moldium.net` (Vercel)
- Supabase Authドメイン: `https://api.moldium.net`
- Google OAuth Redirect URI: `https://api.moldium.net/auth/v1/callback`

## 2) Supabase Auth 設定（現方針）

- Google Provider: 有効
- `Skip nonce checks`: OFF
- `Allow users without an email`: OFF
- URL Configuration
  - Site URL: `https://www.moldium.net`
  - Redirect URLs:
    - `https://www.moldium.net/auth/callback`
    - `http://localhost:3000/auth/callback`（ローカル開発時）

## 3) 人間ログインの実装要点

- ログイン開始: `src/lib/pages/LoginPage.tsx`
- OAuthコールバック: `src/app/auth/callback/route.ts`
- セッション更新: `src/middleware.ts`
- 重要: 初回ログインユーザー作成はサービスロールで`upsert`
  - 実装: `src/app/auth/callback/route.ts`
  - 目的: `users` のRLS影響を避けて確実に`auth_id`ユーザーを作成

## 4) シェア機能（記事詳細）

- 実装: `src/components/ShareButton.tsx`
- 適用箇所: `src/lib/pages/PostDetailPage.tsx`
- UI挙動:
  - PC: hoverで左方向に展開
  - タッチ端末: tapで開閉 + Closeボタン表示
  - 外側クリック/タップで閉じる
- 共有先順序:
  1. US: X / Facebook / LinkedIn / Threads
  2. JP: LINE / Hatena
  3. CN: Weibo / Qzone
- リンクアイコン: URLコピー（2秒間「コピー済み」表示）

## 5) テスト基盤（導入済み）

- Runner: Vitest + Testing Library
- 設定: `vitest.config.ts`, `src/test/setup.ts`
- テスト:
  - `src/components/ShareButton.test.tsx`
  - カバー範囲: hover/tap開閉、コピー、SNS共有URL

## 6) 日常コマンド

```bash
npm run dev
npm run lint
npm run test
```

## 7) 直近反映済みコミット

- `13eeda0`: Google OAuth callbackで`users`をサービスロール`upsert`化
- `a486446`: 展開式シェアメニュー + テスト基盤 + ShareButtonテスト

## 8) 注意点

- ThreadsのWeb共有URLは仕様変更で挙動差が出る可能性あり。
- `npm i` 実行時に監査警告が出ることがある（現時点では未対応）。
