# モバイル完全パリティ実装プラン（チェックリスト）

本プランは `MOBILE_PARITY_GAPS.md` を基にしています。実装に合わせて
チェックを更新し、必要に応じてタスクを追加します。

## Phase 1: ストレージ層のパリティ（最優先）

- [x] SQLiteアダプタにWeb同等のデータ挙動を実装。
  - [x] 添付: ファイル情報 + データ保存（またはURI方式）と `addAttachment` 実装。
  - [x] Issueリンク/サブタスク: `addIssueLink`, `getSubtasks` 実装。
  - [x] 履歴/ワークフロー: `updateIssue` と同様の履歴書き込み + 遷移検証。
  - [x] 通知: Issueイベント（作成/割当/状態変更/コメント）で通知生成。
  - [x] ウォッチャー: Issue作成時に `watcherIds` を初期化。
  - [x] 権限: `hasPermission` の制限をWebと同等に。
  - [x] リアクティブ更新: `watchAll`/`watchById` をポーリング等で補完。
  - 対象ファイル:
    - `packages/storage/src/mobile/sqliteStorageAdapter.ts`
    - `packages/storage/src/mobile/index.ts`
    - `packages/storage/src/contracts.ts`（必要なら拡張）

## Phase 2: Issue詳細の完全化

- [x] WebのIssueDrawer機能をモバイル詳細画面に移植（フルスクリーン）。
  - [x] 編集: title/description/status/priority/type/assignee
  - [x] アクティビティ: comments/history/worklog
  - [x] サブタスク/リンク/添付
  - [x] watch/unwatch, share, delete（確認付き）
  - [x] fixVersion選択
  - [x] 添付ピッカーを追加（expo-document-picker）
  - 対象ファイル:
    - `apps/mobile/app/issue/[issueId].tsx`
    - `apps/web/src/pages/IssueDrawer.tsx`

## Phase 3: Home画面の同等化

- [x] 挨拶/オンライン表示、担当課題一覧、クイックアクション、最近見た、
  ステータス操作を実装。
  - 対象ファイル:
    - `apps/mobile/app/(tabs)/home.tsx`
    - `apps/web/src/pages/Home.tsx`

## Phase 4: Projects一覧の同等化

- [x] カードUI（アイコン/説明/カテゴリ）、スター操作、スター優先ソート。
- [x] プロジェクト作成でカテゴリ/アイコン設定を追加。
  - 対象ファイル:
    - `apps/mobile/app/(tabs)/projects.tsx`
    - `apps/mobile/app/modal.tsx`
    - `apps/web/src/pages/Projects.tsx`
    - `apps/web/src/components/Modals/CreateProjectModal.tsx`

## Phase 5: Projectビューのタブ完全化

- [x] Summary: 統計カード/チャート/ワークロード/エピック進捗を実装。
- [x] Board: スイムレーン、クイックフィルタ、WIP制限、状態別作成を実装（ステータス移動はボタン操作）。
- [x] Board: D&D操作の導入を検討（必要なら追加実装）。
- [x] Backlog: スプリント作成/開始/完了、インライン作成、バックログ管理を実装。
- [x] Backlog: D&D操作の導入を検討（必要なら追加実装）。
- [x] Timeline: ズーム/期日編集可能なタイムラインを実装（期日編集は入力方式）。
- [x] Releases: 期日/進捗/ステータス表示を追加。
- [x] Automation: ルール一覧と監査ログのUIをWebと揃える。
- [x] Settings: details/workflow/permissions/notifications のサブタブ + エディタモーダル。
  - 対象ファイル:
    - `apps/mobile/app/project/[projectId]/index.tsx`
    - `apps/web/src/components/Project/*`

## Phase 6: Searchの同等化

- [x] advanced切替UI、保存モーダル、課題カードUIをWebと揃える。
- [x] 保存フィルタの挙動をWebに合わせる。
  - 対象ファイル:
    - `apps/mobile/app/(tabs)/search.tsx`
    - `apps/web/src/pages/Search.tsx`
    - `apps/web/src/pages/savedFilterActions.ts`

## Phase 7: Notificationsの同等化

- [x] 種別アイコン、既読制御、手動「全既読」を実装。
- [x] 画面表示時の自動全既読を撤廃。
  - 対象ファイル:
    - `apps/mobile/app/(tabs)/notifications.tsx`
    - `apps/web/src/pages/Notifications.tsx`

## Phase 8: Profile / Help / Setupの同等化

- [x] Profile: アバター編集/通知トグル/言語/ログアウト/ヘルプ/確認ダイアログを追加。
- [x] Help: カードUI/サポートCTAを追加。
- [x] Setup: SetupWizardの強制表示挙動をモバイルに反映。
  - 対象ファイル:
    - `apps/mobile/app/(tabs)/profile.tsx`
    - `apps/mobile/app/(tabs)/help.tsx`
    - `apps/mobile/app/setup.tsx`
    - `apps/mobile/app/index.tsx`

## Phase 9: ナビゲーション/グローバル導線

- [x] グローバル作成ボタンの統一導線を追加。
- [x] Project内でも常に作成導線が見える構成にする。
- [x] TopBar相当の設計（必要なら）を検討。
  - 対象ファイル:
    - `apps/mobile/app/_layout.tsx`
    - `apps/mobile/app/(tabs)/_layout.tsx`
    - `apps/web/src/App.tsx`

## Phase 10: Enum網羅 + QA

- [x] Mobile UIが全enumを扱えるようにする。
  - [x] IssueType: Epic
  - [x] IssuePriority: Highest/Lowest
  - [x] IssueStatus: In Review
- [x] パリティテスト/データ挙動のテストを追加。
  - 対象ファイル:
    - `packages/core/src/types/issue.ts`
    - `packages/storage/__tests__/adapter_parity.test.ts`
