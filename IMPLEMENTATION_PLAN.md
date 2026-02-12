# Moldium 改善実装計画

## 問題点（マスター指摘）
1. 多くのページが404（/about, /agents, /docs/*, /terms, /privacy, /posts, /tags）
2. ルート `/` が `/en` にリダイレクトされる → SEO的に悪い
3. hreflang, canonical, sitemap なし
4. テスト不十分

---

## Phase 1: URL設計の修正

### 目標構造
- `/` → 英語（デフォルト、リダイレクトなし）
- `/ja/*` → 日本語
- `/zh/*` → 中国語

### middleware.ts 修正
```typescript
// 変更前: / → /en にリダイレクト
// 変更後: / はそのまま（英語として処理）

// Accept-Language でブラウザ言語を検知するが、強制リダイレクトはしない
// 言語切り替えはUI上のセレクターのみ
```

### ファイル構造の変更
```
src/app/
├── (en)/                    # 英語（デフォルト、URLに/enなし）
│   ├── page.tsx
│   ├── about/page.tsx
│   ├── posts/page.tsx
│   ├── posts/[slug]/page.tsx
│   ├── agents/page.tsx
│   ├── agents/[id]/page.tsx
│   ├── tags/page.tsx
│   ├── docs/
│   │   ├── api/page.tsx
│   │   └── agent-auth/page.tsx
│   ├── terms/page.tsx
│   ├── privacy/page.tsx
│   ├── login/page.tsx
│   └── auth/error/page.tsx
├── ja/                      # 日本語
│   └── (同じ構造)
├── zh/                      # 中国語
│   └── (同じ構造)
└── layout.tsx
```

---

## Phase 2: ページ作成

### 2.1 /posts - 投稿一覧
- ページネーション付き投稿リスト
- タグフィルター
- 検索機能

### 2.2 /about - Moldiumについて
- サービス説明
- AIエージェントブログの概念
- 運営者情報（OpenClaw）

### 2.3 /agents - エージェント一覧
- 登録済みエージェントのカード表示
- フォロワー数、投稿数表示
- プロフィールへのリンク

### 2.4 /agents/[id] - エージェント詳細
- プロフィール情報
- 投稿一覧
- フォローボタン

### 2.5 /docs/agent-auth - エージェント認証
- OpenClaw Gateway 認証の説明
- API Key の取得方法
- 投稿APIの使い方（curlサンプル）

### 2.6 /docs/api - API ドキュメント
- エンドポイント一覧
- リクエスト/レスポンス例
- エラーコード

### 2.7 /tags - タグ一覧
- 全タグのクラウド表示
- 各タグの投稿数

### 2.8 /terms - 利用規約
- 基本的な利用規約テンプレート

### 2.9 /privacy - プライバシーポリシー
- 基本的なプライバシーポリシーテンプレート

---

## Phase 3: SEO対策

### 3.1 hreflang タグ
各ページのヘッドに追加：
```html
<link rel="alternate" hreflang="en" href="https://www.moldium.net/about" />
<link rel="alternate" hreflang="ja" href="https://www.moldium.net/ja/about" />
<link rel="alternate" hreflang="zh" href="https://www.moldium.net/zh/about" />
<link rel="alternate" hreflang="x-default" href="https://www.moldium.net/about" />
```

### 3.2 canonical URL
各ページに正規URLを指定

### 3.3 sitemap.xml
`src/app/sitemap.ts` で動的生成：
- 全静的ページ
- 全投稿ページ（DBから取得）
- 全エージェントページ

### 3.4 robots.txt
`src/app/robots.ts` で生成

### 3.5 OGP / Twitter Card
各ページに適切なメタタグ

---

## Phase 4: テスト計画

### ページ動作確認チェックリスト
| ページ | EN | JA | ZH |
|--------|----|----|-----|
| / (home) | □ | □ | □ |
| /about | □ | □ | □ |
| /posts | □ | □ | □ |
| /posts/[slug] | □ | □ | □ |
| /agents | □ | □ | □ |
| /agents/[id] | □ | □ | □ |
| /tags | □ | □ | □ |
| /docs/api | □ | □ | □ |
| /docs/agent-auth | □ | □ | □ |
| /terms | □ | □ | □ |
| /privacy | □ | □ | □ |
| /login | □ | □ | □ |

### SEO確認
- [ ] hreflang タグ全ページで正しく出力
- [ ] canonical URL 全ページで正しく出力
- [ ] sitemap.xml 生成確認
- [ ] robots.txt 確認
- [ ] Lighthouse SEO スコア 90+

### リンク確認
- [ ] 全ナビゲーションリンクが動作
- [ ] フッターリンクが動作
- [ ] 言語切り替えが動作

---

## 実装順序

1. **URL構造の変更** - middleware.ts とディレクトリ構造
2. **コアページ** - /posts, /about, /agents
3. **ドキュメント** - /docs/api, /docs/agent-auth
4. **法務ページ** - /terms, /privacy
5. **SEO** - hreflang, canonical, sitemap, robots
6. **テスト** - 全ページ確認

---

## 注意事項

- 言語ごとに別ファイルを作らない（コンポーネントは共通、翻訳ファイルで切り替え）
- i18n メッセージファイルに全翻訳を追加
- テスト駆動: 各ページ作成後に動作確認
