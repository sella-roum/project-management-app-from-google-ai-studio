# Mobile UX カラートークン指針 & マイグレーション

## 目的
- Light/Dark の対応表を明示し、全画面で一貫した色運用を可能にする。
- 既存のハードコード色を段階的にトークンへ移行する。

## カラートークン対応表
| Category | Token | Light | Dark | 主用途 |
| --- | --- | --- | --- | --- |
| Brand | brandPrimary | #0a7ea4 | #4fd1ff | 主要CTA/リンク |
| Brand | brandSecondary | #1d4ed8 | #93c5fd | 補助アクション |
| Surface | surfaceBase | #f8fafc | #0f172a | 画面背景 |
| Surface | surfaceRaised | #ffffff | #111827 | カード/シート |
| Surface | surfaceOverlay | #f1f5f9 | #1f2937 | モーダル/オーバーレイ |
| Text | textPrimary | #0f172a | #f8fafc | 見出し/本文 |
| Text | textSecondary | #475569 | #cbd5e1 | 補足/サブ情報 |
| Text | textTertiary | #64748b | #94a3b8 | キャプション/注釈 |
| Text | textDisabled | #94a3b8 | #64748b | 非活性 |
| Border | borderSubtle | #e2e8f0 | #1f2937 | 区切り/カード枠 |
| Border | borderStrong | #cbd5e1 | #334155 | 強調枠 |
| State | stateSuccessBg | #dcfce7 | #14532d | 成功背景 |
| State | stateSuccessText | #15803d | #86efac | 成功文字 |
| State | stateWarningBg | #fef3c7 | #78350f | 警告背景 |
| State | stateWarningText | #b45309 | #fcd34d | 警告文字 |
| State | stateErrorBg | #fee2e2 | #7f1d1d | エラー背景 |
| State | stateErrorText | #b91c1c | #fecaca | エラー文字 |
| State | stateInfoBg | #dbeafe | #1e3a8a | 情報背景 |
| State | stateInfoText | #1d4ed8 | #bfdbfe | 情報文字 |

## 使い分けルール（必須）
- **Primary CTA**：`brandPrimary` を背景、文字は `surfaceRaised`。
- **Secondary CTA**：背景は `surfaceRaised`、枠線は `borderSubtle`、文字は `textPrimary`。
- **Ghost CTA**：背景は透明、文字は `brandPrimary`。
- **カード背景**：`surfaceRaised` + `borderSubtle`。
- **補足情報**：`textSecondary` または `textTertiary` を使用。
- **状態色**：背景は `state*Bg`、文字は `state*Text`。

## マイグレーション手順
1. `rg "#" apps/mobile` でハードコード色を抽出。
2. 色の用途を分類（背景/文字/状態/枠線/アクセント）。
3. 対応するトークンに置換し、Light/Dark で視認性を確認。
4. 置換済み一覧を作成し、漏れがないかレビュー。

