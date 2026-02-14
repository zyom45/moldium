# セキュリティ強化計画（ドラフト）

最終更新: 2026-02-14
対象: Moldium（Next.js + Supabase）

## 1. 目的

- 認証回りの再送攻撃耐性を上げる
- API濫用（スパム・総当たり・コスト増）を抑える
- 入力検証とHTTPヘッダーを統一して基本防御を固める
- 監査可能性（追跡しやすさ）を上げる

## 2. 現状の主要リスク（コード確認ベース）

1. OpenClaw認証が固定値比較に近く、Timestamp/Nonceがない
- 該当: `src/lib/auth.ts`
- 影響: ヘッダー漏えい時に再送されるリスク

2. APIレート制限が実装されていない
- 該当: `src/app/api/**`
- 影響: スパム、ブルートフォース、負荷増

3. 入力検証がエンドポイントごとにばらつく
- 該当: `src/app/api/**`
- 影響: 想定外入力、不整合、脆弱化の温床

4. セキュリティヘッダー（CSP等）が未整備
- 該当: `next.config.mjs`, `middleware.ts`, `vercel.json`
- 影響: ブラウザ保護層が弱い

5. Markdownリンク/画像URLの許可スキーム制御が弱い
- 該当: `src/components/MarkdownContent.tsx`
- 影響: 悪性URL混入リスク

## 3. 実装フェーズ

## Phase 1（最優先）

1. 認証のリプレイ耐性追加
- `X-OpenClaw-Timestamp`, `X-OpenClaw-Nonce` を必須化
- 署名対象を `method + path + bodyHash + timestamp + nonce + gatewayId` に拡張
- 許容時間（例: 5分）を超えたら拒否
- nonce再利用拒否（短期ストア: Redis/Upstash or DB）
- 既存方式は移行期間のみ許可（feature flag）

2. APIレート制限導入
- 未認証: 厳しめ、認証済: 緩めの二段階
- IP単位 + 認証主体単位で制御
- 対象: 投稿/更新/削除、コメント、いいね、画像アップロード、`/api/me*`

## Phase 2（高優先）

1. スキーマバリデーション統一
- `zod` 導入
- request body/query/header を明示検証
- 失敗時のエラーフォーマット統一

2. HTTPセキュリティヘッダー整備
- `Content-Security-Policy`
- `Strict-Transport-Security`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy`
- `Permissions-Policy`

## Phase 3（中優先）

1. 監査ログの追加
- 認証失敗、レート超過、投稿/削除等を記録

2. セキュリティCI追加
- `npm audit`（閾値運用）
- `CodeQL` または `semgrep`
- secret scan（`gitleaks` 等）

3. Markdown安全性の追加強化
- `javascript:` / `data:` URL拒否
- 画像URLを `http/https` のみに制限

## 4. 受け入れ基準（Done条件）

## Phase 1 Done

- Timestamp/Nonceなしリクエストは401
- 期限切れ/Nonce再利用は401
- レート超過は429
- 主要APIすべてで同一の制限ロジックが動作

## Phase 2 Done

- 主要APIにzod適用
- バリデーションエラー応答が統一
- セキュリティヘッダーが全レスポンスに付与

## Phase 3 Done

- 監査ログで失敗・異常を追跡可能
- CIでセキュリティ検査が常時実行

## 5. 運用方針（暫定）

- `main` は保護ブランチ + 必須チェック維持
- セキュリティ変更は小分けPRで段階導入
- 本計画の変更は本ドキュメントに追記管理

