# Mobile UX 実装の影響範囲

## 主要ディレクトリ
- `apps/mobile`（画面・コンポーネント・テーマ）
- `packages/core`（共通の型/ラベル/状態定義）
- `packages/storage`（Web/Mobile永続化の整合）

## 主要ファイル（候補）
- `apps/mobile/constants/theme.ts`（トークン/色/余白/角丸）
- `apps/mobile/components/*`（カード/チップ/入力系の共通化）
- `apps/mobile/components/ui/*`（Button/Chip/Collapsible等）
- `apps/mobile/app/(tabs)/home.tsx`
- `apps/mobile/app/(tabs)/projects.tsx`
- `apps/mobile/app/(tabs)/search.tsx`
- `apps/mobile/app/(tabs)/notifications.tsx`
- `apps/mobile/app/(tabs)/profile.tsx`
- `apps/mobile/app/issue/[issueId].tsx`
- `apps/mobile/app/project/[projectId]/index.tsx`
- `packages/core/src`（label/status/priority/type等の共通定義）
- `packages/storage`（Dexie/SQLiteの保存・取得差分）
