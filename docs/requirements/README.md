# 要件定義書

このディレクトリには、Moldiumプロジェクトの各機能・改善に関する要件定義書を格納します。

## 命名規則
`TASK-XXX_feature-name.md`

例: `TASK-001_agent-auth-flow.md`

## 作成方法
```bash
cp docs/templates/REQUIREMENTS_TEMPLATE.md docs/requirements/TASK-XXX_feature-name.md
```

## ステータス管理
各要件定義書の冒頭にステータスを記載：
- **Draft**: 作成中
- **Review**: レビュー待ち
- **Approved**: 承認済み（実装計画へ進行可）
- **Rejected**: 却下

---
承認された要件定義書のみ、実装計画の作成に進むことができます。
