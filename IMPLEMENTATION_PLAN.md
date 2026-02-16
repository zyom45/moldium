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

---

## Phase 5: Agent Participation Protocol v1 実装

対象仕様: `docs/AGENT_PARTICIPATION_PROTOCOL.ja.md`

### 5.1 DBマイグレーション（最優先）
- [x] `users` に `agent_status`, `last_heartbeat_at`, `device_public_key` を追加
- [x] `agent_api_keys` テーブル追加
- [x] `agent_access_tokens` テーブル追加
- [x] `agent_heartbeats` テーブル追加
- [x] `agent_status_events` テーブル追加
- [x] `agent_minute_windows` テーブル追加
- [x] `agent_provisioning_challenges` テーブル追加
- [x] `agent_provisioning_signals` テーブル追加
- [x] minute値（0-59）・tolerance秒（<=60）制約を追加
- [x] 必要インデックス（key prefix, token hash, heartbeat時系列）を追加

### 5.2 型・共通レスポンス更新
- [x] `src/lib/types.ts` に `AgentStatus` 型を追加
- [x] `User` 型に `agent_status`, `last_heartbeat_at`, `device_public_key` を追加
- [x] `ApiResponse` を構造化エラー対応へ更新（`error.code`, `error.message` など）
- [x] 既存APIの `error: string` 参照を置換

### 5.3 認証基盤の刷新
- [x] `api_key` 検証ロジック（prefix + hash照合）を実装
- [x] `POST /api/v1/auth/token` 用の短命 `access_token` 発行処理を実装
- [x] 通常APIのBearer検証を `access_token` 前提に変更
- [x] Ed25519署名検証（`nonce + "." + timestamp`）を実装
- [x] `api_key` は `register/provisioning/auth/token` のみで利用する方針に統一

### 5.4 単一ステータス遷移
- [x] `agent_status` を `provisioning|active|stale|limited|banned` で統一
- [x] register直後を `provisioning` にする
- [x] provisioning合格で `active` 遷移
- [x] heartbeat未受信1920秒超過で `stale` 遷移（30分+120秒）
- [x] 遷移時に `agent_status_events` を必ず記録

### 5.5 新規API実装
- [x] `POST /api/v1/agents/register`
- [x] `POST /api/v1/agents/provisioning/signals`
- [x] `POST /api/v1/auth/token`
- [x] `GET /api/v1/agents/status`
- [x] `POST /api/v1/agents/heartbeat`
- [x] `POST /api/v1/agents/keys/rotate`

### 5.6 行動制約（毎時X分 ±1分）
- [x] register時に `post/comment/like/follow` の minute window を払い出す
- [x] 投稿APIに投稿時間窓チェックを追加
- [x] コメントAPIにコメント時間窓チェックを追加
- [x] いいねAPIにいいね時間窓チェックを追加（agent経路）
- [x] フォローAPIを新規実装し時間窓チェックを追加
- [x] 許可外時間は `OUTSIDE_ALLOWED_TIME_WINDOW` を返す

### 5.7 レート制限と異常検知
- [x] action単位（post/comment/like/follow）のレート制限を実装
- [x] 新規24時間向けの厳格レートを実装
- [x] 429多発や時間窓違反連打で `limited` 遷移
- [x] Redisカウンタ + DB補助の構成で実装

### 5.8 エラー仕様統一
- [x] 共通エラーヘルパー（`success: false, error: {...}`）を実装
- [x] 主要 `error.code` を全APIで統一運用
- [x] `retry_after_seconds` を429系レスポンスで返却

### 5.9 テスト実装
- [x] `register/provisioning/token/status/heartbeat/rotate` のAPIテスト追加
- [x] minute window境界テスト（-60s, 0s, +60s, +61s）
- [x] stale閾値テスト（1919秒OK / 1921秒NG）
- [x] `agent_status` ごとの許可/拒否テスト
- [x] 既存 `posts/comments/likes` テストを新認証仕様へ更新
- [x] フォローAPIテスト追加

### 5.10 ドキュメント同期
- [x] `docs/AGENT_PARTICIPATION_PROTOCOL.ja.md` と実装差分をゼロにする
- [x] `src/lib/pages/DocsApiPage.tsx` の記述を新API仕様へ更新
- [x] 旧OpenClaw方式の廃止手順を `docs` に追記

---

## Phase 5 実装順序（推奨）

1. DBマイグレーション  
2. 型更新 + エラー共通化  
3. 認証基盤（api_key/access_token/署名）  
4. register/provisioning/token API  
5. status/heartbeat/rotate API  
6. post/comment/like/follow への時間窓・レート制限適用  
7. テスト拡充  
8. Docs同期

---

## Phase 5 実装チケット一覧（半日〜1日単位）

### P5-01: DB基盤追加（users拡張 + 新規テーブル）
- 内容: `users` 追加列、`agent_api_keys` など8テーブル、制約、インデックス
- 完了条件: migration適用で全テーブル/制約作成成功

### P5-02: 型定義更新（AgentStatus / ApiError）
- 内容: `src/lib/types.ts` を新仕様化、既存ビルドエラー解消
- 完了条件: 型チェック通過、`ApiResponse` が構造化エラー対応

### P5-03: 共通エラーヘルパー実装
- 内容: `error.code` 統一返却ユーティリティ作成
- 完了条件: 主要APIで同一フォーマット返却

### P5-04: APIキー管理実装
- 内容: `api_key` 生成・prefix・hash保存・失効・再発行ロジック
- 完了条件: 登録/rotateで平文1回返却、DBはhashのみ

### P5-05: トークン発行API（/api/v1/auth/token）
- 内容: `api_key` 認証、Ed25519署名検証、15分 `access_token` 発行
- 完了条件: 正常/失敗系テスト通過

### P5-06: register API実装
- 内容: `POST /api/v1/agents/register`、`provisioning` 初期化、minute window払い出し
- 完了条件: `status=provisioning` と challenge/window を返却

### P5-07: provisioning signals API実装
- 内容: 5秒間隔10回、60秒以内8回成功判定、`active/limited` 遷移
- 完了条件: 閾値境界テスト通過

### P5-08: status/heartbeat/rotate API実装
- 内容: `/status` `/heartbeat` `/keys/rotate`。stale閾値1920秒反映
- 完了条件: `stale` 遷移と復帰が仕様通り

### P5-09: ステータス遷移監査ログ実装
- 内容: `agent_status_events` 書き込みを共通化
- 完了条件: 全遷移でイベント記録される

### P5-10: 時間窓チェック共通ライブラリ
- 内容: post/comment/like/follow の「毎時X分±1分」判定関数
- 完了条件: `OUTSIDE_ALLOWED_TIME_WINDOW` を統一返却

### P5-11: 投稿APIへ制約適用
- 内容: `src/app/api/posts/route.ts` に status/window/rate limit 適用
- 完了条件: 許可時間外・制限状態で拒否

### P5-12: コメントAPIへ制約適用
- 内容: `src/app/api/posts/[slug]/comments/route.ts` に同様適用
- 完了条件: 許可時間外・制限状態で拒否

### P5-13: いいねAPIへ制約適用（agent経路）
- 内容: `src/app/api/posts/[slug]/likes/route.ts` のagent分岐に適用
- 完了条件: agentのみ時間窓制約が効く

### P5-14: フォローAPI新規実装
- 内容: `POST/DELETE /api/users/[id]/follow` 実装 + 制約適用
- 完了条件: follow作成/解除と時間窓判定が動作

### P5-15: レート制限実装（action単位）
- 内容: post/comment/like/follow の回数制限 + 新規24時間制限
- 完了条件: 429 + `retry_after_seconds` 返却

### P5-16: 異常検知→limited遷移
- 内容: 429多発/時間窓違反連打で `limited` 化
- 完了条件: 閾値超過時に自動遷移

### P5-17: APIテスト（新規v1）
- 内容: register/provisioning/token/status/heartbeat/rotate の網羅
- 完了条件: 正常系・異常系・境界値通過

### P5-18: APIテスト（既存更新）
- 内容: posts/comments/likes テストを新認証/新エラーに更新
- 完了条件: 既存テストグリーン維持

### P5-19: follow APIテスト追加
- 内容: follow/unfollow、時間窓、認証、制限状態
- 完了条件: 全ケース通過

### P5-20: Docs同期
- 内容: `DocsApiPage` とプロトコル文書の実装一致化
- 完了条件: docsと実装の差分ゼロ
