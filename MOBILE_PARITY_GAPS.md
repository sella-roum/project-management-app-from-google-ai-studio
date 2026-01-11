# モバイルのパリティ不足点（Web -> Mobile）

本ドキュメントは、Webと比較したモバイル側の機能・レイアウト差分を整理したものです。
`apps/web` / `apps/mobile` と `packages/storage` を基にしています。

## 対象範囲・参照先

- Webルーティング/レイアウト: `apps/web/src/App.tsx`,
  `apps/web/src/components/Layout/*`
- Mobileルーティング/レイアウト: `apps/mobile/app/_layout.tsx`,
  `apps/mobile/app/(tabs)/_layout.tsx`
- 画面実装: `apps/web/src/pages/*`, `apps/mobile/app/*`
- プロジェクト配下ビュー: `apps/web/src/components/Project/*`,
  `apps/mobile/app/project/[projectId]/index.tsx`
- ストレージアダプタ: `packages/storage/src/web/dexieStorageAdapter.ts`,
  `packages/storage/src/mobile/sqliteStorageAdapter.ts`
- 既存チェックリスト: `docs/feature_parity.md`

## 高優先度の不足（機能 + レイアウト）

1. 課題詳細のパリティが不足。
   - Webは編集可能なIssueDrawerで、ステータス変更、コメント、履歴、
     作業ログ、添付、リンク、サブタスク、ウォッチ、共有、削除、
     修正バージョン選択まで対応:
     `apps/web/src/pages/IssueDrawer.tsx`.
   - Mobileは閲覧中心で一部項目のみ表示:
     `apps/mobile/app/issue/[issueId].tsx`.

2. Home画面のパリティが不足。
   - Webは挨拶、オンライン状態、担当課題一覧、クイックアクション、
     最近見た課題、ステータス操作を表示:
     `apps/web/src/pages/Home.tsx`.
   - Mobileは件数とリンクのみ:
     `apps/mobile/app/(tabs)/home.tsx`.

3. ダッシュボードが未実装。
   - Webはガジェット構成とチャート:
     `apps/web/src/pages/Dashboards.tsx`.
   - Mobileはプレースホルダ:
     `apps/mobile/app/(tabs)/dashboards.tsx`.

4. プロジェクトのワークフロー体験が大幅に簡略化。
   - WebはBoard/Backlog/Timeline/Releases/Settingsが充実:
     `apps/web/src/components/Project/*`.
   - Mobileは単一ファイル内の簡易タブ構成:
     `apps/mobile/app/project/[projectId]/index.tsx`.

5. ストレージの差分が機能不足を誘発。
   - SQLite側に未実装/簡略実装が多数:
     `packages/storage/src/mobile/sqliteStorageAdapter.ts`.

## ナビゲーション/レイアウト差分

- WebはTopBar、Sidebar、BottomNav、MobileDrawerを持つ:
  `apps/web/src/App.tsx`, `apps/web/src/components/Layout/*`.
- Mobileはタブバー + FABで、TopBar/Drawer相当がない:
  `apps/mobile/app/(tabs)/_layout.tsx`.
- 課題作成の導線が異なる:
  - Web: TopBarのグローバル作成 + Project Boardの追加ボタン。
  - Mobile: タブ内FABとプロジェクト内リンクのみ。
    `/project/[projectId]` ではFABが表示されない。
- セットアップ導線が異なる:
  - Web: ログイン済みなら全画面Wizardを強制表示:
    `apps/web/src/components/Modals/SetupWizard.tsx`.
  - Mobile: インデックスから `/setup` にリダイレクトのみ:
    `apps/mobile/app/index.tsx`, `apps/mobile/app/setup.tsx`.

## 画面別の不足点

### Welcome + Login
- Mobileはレイアウト/文言が簡略化。
  - Web: `apps/web/src/pages/Welcome.tsx`,
    `apps/web/src/pages/Login.tsx`.
  - Mobile: `apps/mobile/app/(auth)/welcome.tsx`,
    `apps/mobile/app/(auth)/login.tsx`.

### Home
- 担当課題一覧/最近見た/クイックアクション/ステータス変更が未実装。
  - Web: `apps/web/src/pages/Home.tsx`.
  - Mobile: `apps/mobile/app/(tabs)/home.tsx`.

### Projects一覧
- カードUI（アイコン/説明/カテゴリ）とスター優先ソートが未対応。
  - Web: `apps/web/src/pages/Projects.tsx`.
  - Mobile: `apps/mobile/app/(tabs)/projects.tsx`.
- スターUIが仮置き文字。
  - Mobile: `apps/mobile/app/(tabs)/projects.tsx`.
- プロジェクト作成でカテゴリ/アイコン設定が未対応。
  - Web: `apps/web/src/components/Modals/CreateProjectModal.tsx`.
  - Mobile: `apps/mobile/app/modal.tsx`.

### Projectビュー（Summary/Board/Backlog/Timeline/Releases/Automation/Settings）

Summary
- Web: 統計/チャート/ワークロード/エピック進捗あり。
- Mobile: 件数のみ。
  - Web: `apps/web/src/components/Project/ProjectSummary.tsx`.
  - Mobile: `apps/mobile/app/project/[projectId]/index.tsx`.

Board
- Web: スイムレーン、D&D、クイックフィルタ、WIP制限、状態別作成。
- Mobile: ステータス分類のみ。
  - Web: `apps/web/src/components/Project/ProjectBoard.tsx`.
  - Mobile: `apps/mobile/app/project/[projectId]/index.tsx`.

Backlog
- Web: スプリント管理、インライン作成、D&D。
- Mobile: フラット一覧のみ。
  - Web: `apps/web/src/components/Project/ProjectBacklog.tsx`.
  - Mobile: `apps/mobile/app/project/[projectId]/index.tsx`.

Timeline
- Web: ズーム/期日編集可能なタイムライン。
- Mobile: プレースホルダ。
  - Web: `apps/web/src/components/Project/ProjectTimeline.tsx`.
  - Mobile: `apps/mobile/app/project/[projectId]/index.tsx`.

Releases
- Web: 期日/進捗/ステータス表示あり。
- Mobile: バージョン名/状態表示のみ。
  - Web: `apps/web/src/components/Project/ProjectReleases.tsx`.
  - Mobile: `apps/mobile/app/project/[projectId]/index.tsx`.

Automation
- Mobileは基本CRUDのみで、監査ログUXが簡素。
  - Web: `apps/web/src/components/Project/ProjectAutomation.tsx`.
  - Mobile: `apps/mobile/app/project/[projectId]/index.tsx`.

Settings
- Web: details/workflow/permissions/notificationsのサブタブ + エディタモーダル。
- Mobile: 単一フォーム + カンマ区切り入力、権限タブなし。
- Mobileは破壊操作の確認ダイアログなし。

### Search
- Web: advanced切替・保存モーダル・リッチな課題カード。
- Mobile: 簡易UIとリスト表示のみ。
  - Web: `apps/web/src/pages/Search.tsx`.
  - Mobile: `apps/mobile/app/(tabs)/search.tsx`.

### Notifications
- Web: 種別アイコン、既読管理、手動「全既読」。
- Mobile: 画面表示時に自動全既読、個別制御なし。
  - Web: `apps/web/src/pages/Notifications.tsx`.
  - Mobile: `apps/mobile/app/(tabs)/notifications.tsx`.

### Profile
- Web: アバター編集/通知トグル/言語/ログアウト/ヘルプ/確認ダイアログ。
- Mobile: 名前/メール更新 + リセットのみ（確認なし）。
  - Web: `apps/web/src/pages/Profile.tsx`.
  - Mobile: `apps/mobile/app/(tabs)/profile.tsx`.

### Help Center
- Web: カードUI/CTAあり。
- Mobile: テキストのみ。
  - Web: `apps/web/src/pages/HelpCenter.tsx`.
  - Mobile: `apps/mobile/app/(tabs)/help.tsx`.

## データ/ストレージの差分（SQLite vs Dexie）

- 添付ファイルが未実装。
  - Web: `addAttachment` がファイル内容を保存。
  - Mobile: `addAttachment` がno-op。

- Issueリンクとサブタスクが未実装。
  - Web: `addIssueLink`, `getSubtasks` が実装済み。
  - Mobile: `addIssueLink` がno-op, `getSubtasks` は空配列。

- 履歴とワークフロー遷移チェックが未実装。
  - Web: `updateIssue` が履歴を書き込み、遷移検証。
  - Mobile: `updateIssueInternal` が単純更新のみ。

- Issueイベント通知の自動生成が未実装。
  - Web: `dispatchProjectNotification` が作成/割当/状態/コメントで発火。
  - Mobile: 同等処理なし。

- ウォッチャー初期化が未実装。
  - Web: 作成時に `watcherIds` を初期化。
  - Mobile: UIから設定されず空のまま。

- 権限チェックが無効化されている。
  - Web: `hasPermission` で制限あり。
  - Mobile: 常に `true` を返す。

- リアクティブ更新が実質未実装。
  - Web: Dexie live query で自動更新。
  - Mobile: `watchAll`/`watchById` はno-op。

## Enum/選択肢の不足

- IssueTypeのEpicがモバイルUIにない。
  - Web: `apps/web/src/components/Modals/CreateIssueModal.tsx`.
  - Mobile: `apps/mobile/app/modal.tsx`.
- IssuePriorityのHighest/LowestがモバイルUIにない。
  - Web: `apps/web/src/components/Modals/CreateIssueModal.tsx`.
  - Mobile: `apps/mobile/app/modal.tsx`.
- IssueStatusのIn Reviewに移行するUIがない。
