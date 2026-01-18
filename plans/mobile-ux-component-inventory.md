# Mobile UI コンポーネント一覧（用途/利用画面/改善対象）

`apps/mobile/components/*` と `apps/mobile/components/ui/*` を対象に一覧化しています。

| コンポーネント | 用途 | 利用画面/箇所 | 改善対象（候補） |
| --- | --- | --- | --- |
| `empty-state.tsx` | 空状態の説明表示 | Home / Search / Issue Detail / Project Detail | アイコン・CTAの追加、空状態の文言テンプレート統一 |
| `external-link.tsx` | 外部リンクのラッパー | 現状利用なし | 未使用なら削除、またはHelp等で利用 |
| `floating-action-button.tsx` | グローバル作成CTA | Tabs layout / Project detail | 画面別の表示条件整理、共通の押下表現 |
| `haptic-tab.tsx` | タブ押下時の触覚反応 | Tabs layout | haptics強度の統一、アクセシビリティ配慮 |
| `hello-wave.tsx` | デモ用の挨拶表示 | 現状利用なし | 未使用なら削除、またはオンボーディングで再利用 |
| `issue-card.tsx` | Issueカード表示 | Search | ProjectCardとの構成統一、押下表現の統一 |
| `parallax-scroll-view.tsx` | パララックス用スクロール | 現状利用なし | 未使用なら削除、必要なら統一テーマ対応 |
| `selection-sheet.tsx` | 選択肢のボトムシート | Issue Detail | Inputのフォーカス/エラー表現と統合 |
| `setup-wizard.tsx` | 初期セットアップUI | Root layout / Setup screen | Webの導線と情報設計の整合 |
| `skeleton.tsx` | ローディング表示 | Home / Search / Issue Detail / Project Detail | シマー演出、色トーンの統一 |
| `themed-text.tsx` | タイポグラフィ統一 | 全画面 | typeの適用漏れチェック自動化 |
| `themed-view.tsx` | テーマ対応コンテナ | 全画面 | surfaceトークンの使い分け標準化 |
| `ui/button.tsx` | CTAボタン | Login / Welcome / Issue Detail ほか | サイズ/状態（loading/disabled）の統一検証 |
| `ui/chip.tsx` | 状態/タグ表示 | IssueCard / Search | 状態バッジ統一、アイコン追加検討 |
| `ui/collapsible.tsx` | 折りたたみUI | 現状利用なし | 情報過多画面での活用検討 |
| `ui/icon-symbol(.ios).tsx` | SF Symbolsのラッパー | Tabs / Projects / FAB / Collapsible | ブランドカラーや状態色の適用統一 |
