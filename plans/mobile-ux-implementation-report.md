# Mobile UX 実装レポート（作業ログ）

## 実施概要
- タスク順に「Foundation → 共通コンポーネント（Button/SelectionSheet/Homeの一部）」まで着手。
- カラートークン/タイポグラフィ/余白・影の設計基盤を追加。
- IssueCard と Home のカードエリアを新トークンに合わせてアップデート。

## 実施内容（タスク順）
### 0. 事前準備
- 設計方針を維持するため、既存実装への影響が大きい `ThemedText` の型変更は後方互換を優先。
- 大規模な置換が必要と判断し、まずは基盤の拡張を先行。

### 1. デザインシステム（foundation）
- `apps/mobile/constants/theme.ts`
  - 新しいトークンを追加（Surface / Text / State / Border / Brand）。
  - Radius / Spacing / Elevation を追加。
- `plans/mobile-ux-color-tokens.md`
  - Light/Dark の対応表と運用ルールを整理。
  - 置換手順（`rg "#"`）を明文化。
- `plans/mobile-ux-typography.md`
  - ThemedText の運用ルールと階層制約を整理。

### 2. 共通コンポーネント
- `apps/mobile/components/themed-text.tsx`
  - 新しいタイプ（display/headline/body/caption 等）を追加。
  - 旧タイプ（default/defaultSemiBold）を残して後方互換を確保。
  - Linkカラーは brandPrimary を参照するよう変更。
- `apps/mobile/components/issue-card.tsx`
  - Surface/Border/Spacing/Elevation を適用。
  - muted text をテーマトークンから取得。
- `apps/mobile/components/ui/chip.tsx`
  - Status/Priority/Due を共通チップ化し、1行省略で統一。
- `apps/mobile/components/ui/button.tsx`
  - Primary/Secondary/Ghost を実装し、Haptics/disabled/loading を統一。
- `apps/mobile/components/selection-sheet.tsx`
  - Button と新トークンでスタイル統一。
  - 選択中の項目を背景色で強調。
- `apps/mobile/app/issue/[issueId].tsx`
  - アクションバーを Button 化し、トークン化した余白に揃えた。
  - 見出し/本文/注釈のタイプを整理。
- `apps/mobile/app/(tabs)/home.tsx`
  - タスク更新ボタンを Button に置換。
  - Spacing トークンで間隔を統一。
  - 見出し/本文/注釈のタイプを整理。
- `apps/mobile/app/(tabs)/projects.tsx`
  - 見出し/本文/注釈のタイプを整理。
  - カード背景と枠線をトークン化。
- `apps/mobile/app/project/[projectId]/index.tsx`
  - プロジェクト詳細の見出し/本文タイプを整理。
- `apps/mobile/app/(tabs)/search.tsx`
  - フィルタチップとモーダルをトークン化し、タイプ階層を整理。
- `apps/mobile/app/(tabs)/notifications.tsx`
  - 未読状態とアクションをトークン化し、タイプ階層を整理。
- `apps/mobile/app/(tabs)/profile.tsx`
  - プロフィール/メニュー/統計のタイプ階層を整理。
- `apps/mobile/components/setup-wizard.tsx`
  - セットアップの入力/ボタン/テンプレートカードをトークン化。
- `apps/mobile/app/(auth)/welcome.tsx`
  - ウェルカムカードとCTAをトークン化。
- `apps/mobile/app/(auth)/login.tsx`
  - ログインフォームの入力/ボタンをトークン化。
- `plans/mobile-ux-typography-checklist.md`
  - 画面ごとの適用状況をチェックリスト化。
- `apps/mobile/constants/theme.ts`
  - Elevation/Radius/Spacing のルールを定義し、画面に段階適用。

## 試行錯誤ログ
- **タイポグラフィの互換性**
  - 当初は旧タイプを完全削除する案を検討したが、既存画面の使用箇所が多く破壊的変更になるため、`default` と `defaultSemiBold` を残して互換を確保。
- **Linkカラーの扱い**
  - StyleSheet固定色から theme トークンへ移行する方針に変更。
- **Elevation/Shadowの適用範囲**
  - 全カードに一括適用は影響範囲が大きいため、まず `IssueCard` に限定して適用。
- **ボタンの移行範囲**
  - 既存画面の Pressable を一括置換する案は影響が大きいため、Home と SelectionSheet のみを先行移行。

## 未着手/次のステップ
- 8pt grid に合わせた余白調整の全画面適用。
- Form などの共通コンポーネント整備。
- 既存カラーのハードコード置換（`rg "#"` による検出）。

## 実行コマンド
- `npm --workspace apps/mobile run lint`
