# Project Context

## TL;DR
- プロジェクト管理アプリのモノレポで、Web とモバイル（Expo/React Native）を含む。
- モバイルは `apps/mobile` を中心に実装され、テーマは `constants/theme.ts` と `useThemeColor` で管理。

## Key Features
- 主機能:
  - プロジェクト/課題の閲覧・検索・通知などの画面を提供。
- 重要なユーザーフロー:
  - タブ画面（home/projects/search/notifications/profile）を起点に詳細画面へ遷移。

## Architecture / Structure
- 技術スタック:
  - モノレポ（npm workspaces）、モバイルは Expo/React Native。
- ディレクトリの要点:
  - `apps/mobile`: モバイルアプリ本体（Expo Router の `app/` ディレクトリ中心）。
- データフロー/外部連携:
  - テーマは `apps/mobile/constants/theme.ts` の `Colors` と `apps/mobile/hooks/use-theme-color.ts` で配色を決定。
  - 現在は `useColorScheme` をライト固定に変更して運用中。
  - 主要UI文言は `apps/mobile/constants/strings.ts` に集約し始めている。
  - プロジェクト詳細のデータコンテキストは `apps/mobile/components/project/project-context.tsx` に配置。

## How to Run (dev/test)
- Setup:
  - ルートで `npm install`
- Dev:
  - `npm run mobile:start`（必要に応じて `npm run mobile:clear`）
- Test/Lint/Typecheck:
  - 未確認（変更時に要調査）
- Build/Deploy:
  - 未確認

## Known Issues / Tech Debt
- 痛いところ（症状 / 影響 / 典型原因）:
  - ライト/ダークの配色が混在し、固定色が存在するため一貫性に欠ける。
- 優先度高の負債:
  - テーマトークンへの集約とライトテーマ基準への統一。

## Refactoring Notes (living)
- 観察メモ（随時追記）:
  - 固定色の置換やテーマ強制の方針決定が必要。
  - UI/UX 改善の観点では、情報密度とインタラクション状態の統一が優先課題。
  - 追加で情報設計、マイクロコピー、性能体験、オフライン対応の観点を検討する。
- 触ってはいけない領域（地雷）:
  - 未確認

## Pointers
- 参照すべきADR:
  - `docs/adr/ADR-0001-title.md`（空）
- 重要なドキュメント/図:
  - `apps/mobile/README.md`
