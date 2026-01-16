# Mobile UI/UX ブラッシュアップ実装タスク

以下は、提供された改善指示（GPT-5.2 / Gemini-3.0-Pro）を踏まえ、**Mobile を Web の仕様に追従させつつモバイル最適化するための具体的な実装タスク**です。  
実装は **縦割り（UI → 状態 → 永続化 → ナビ → テスト）** で小さく進め、Feature Parity を維持します。

---

## 0. 事前確認（仕様ソース）

- `docs/feature_parity.md` を確認し、現時点の差分・意図的差分を整理する。
- Web 実装の該当画面を確認し、**情報設計の一次情報を Web から抽出**する。

---

## 1. ナビゲーション再構成（Bottom Tabs の整理）

**目的:** 迷いを削減し、主要導線を 4 タブに集約。

### タスク
- [x] `apps/mobile/app/(tabs)/_layout.tsx`
  - [x] Bottom Tabs を **Home / Projects / Search / Profile** に絞る。
  - [x] Notifications / Help / Settings は Profile 配下へ移動。
  - [x] Dashboards は Home もしくは Projects サマリーに統合。
- [x] 影響画面の導線確認
  - [x] 既存のタブ遷移・深いリンク（deep link）を整理。
  - [x] Web の導線と同等の機能アクセスが可能かを検証。

---

## 2. Project 画面の Top Tabs 化（情報設計の再整理）

**目的:** Project 内の画面構成を整理し、Web に追従しつつモバイル最適化。

### タスク
- [x] `apps/mobile/app/project/[projectId]/index.tsx` を分割・整理
  - [x] `_layout.tsx` を新規作成し、Top Tabs ナビゲーションを設定。
  - [x] `summary.tsx` / `board.tsx` / `backlog.tsx` / `timeline.tsx` / `settings.tsx` を分割作成。
- [x] Top Tabs 表示ルール
  - [x] 重要度上位 3 画面を固定表示、残りは「もっと見る」導線へ。
- [x] Project データの取得と共有
  - [x] 既存の取得ロジックを `ProjectProvider` などで共通化。

---

## 3. Board 画面のモバイル最適化（1画面1カラム）

**目的:** モバイルに最適化したカンバン体験を提供。

### タスク
- [x] `apps/mobile/app/project/[projectId]/board.tsx`（Boardタブ）
  - [x] 1画面1カラム表示（PagerView もしくは左右スワイプ）に変更。
  - [x] ステータス切り替え UI を上部タブまたはスワイプで統一。
- [x] ステータス移動の操作改善
  - [x] カード内の小さなボタンを廃止。
  - [x] 長押しメニュー or アクションシートで「次のステータスへ移動」を提供。

---

## 4. Issue 詳細の編集機能強化（Parity 必須）

**目的:** Web で可能な編集操作を Mobile でも完全に実現。

### タスク
- [x] `apps/mobile/app/issue/[issueId].tsx`
  - [x] Description / Story Points / Due Date を編集可能にする。
  - [x] 各フィールドは Auto Save（onBlur / 完了ボタン）に統一。
- [x] Bottom Sheet（SelectionSheet）導入
  - [x] `components/SelectionSheet.tsx` を新規作成。
  - [x] Status / Priority / Assignee の編集は Bottom Sheet に統一。
- [x] 固定アクションバー設置
  - [x] 画面下部に Comment / Status / More の固定アクションを配置。

---

## 5. 一覧 UI/UX 改善（カード統一・視認性向上）

**目的:** 一覧表示の統一感と可読性を高める。

### タスク
- [x] `components/issue-card.tsx`
  - [x] タイトル：太字・濃い黒 (#11181C)。
  - [x] キー：小さめ・薄いグレー (#687076)。
  - [x] 期限切れや高優先度の視覚的強調（アイコンの色変更など）。
- [x] 一覧表示の統一
  - [x] 「カード＋2行要約＋主要メタ（優先度/担当/期日）」を標準レイアウトにする。

---

## 6. Empty / Loading / Error の共通化

**目的:** 状態表示の統一とユーザー迷いの防止。

### タスク
- [x] `components/EmptyState.tsx` を新規作成
  - [x] アイコン＋メッセージ＋「課題作成」アクションボタン付き。
- [x] `components/Skeleton.tsx` を新規作成
  - [x] ローディング中のスケルトン表示（アニメーション含む）。
- [x] 各主要画面（Home / Project / Search / Issue）へ適用。
  - [x] 各主要画面（Home / Project / Search / Issue）へ適用。

---

## 7. 検索体験の強化

**目的:** モバイルでの探索体験を改善し、Web の機能と同等化。

### タスク
- [x] `apps/mobile/app/(tabs)/search.tsx`
  - [x] 最近・保存済み・おすすめ（未完了/自分担当/期限切れ）を上部固定表示。
- [x] 検索フィルタ UX
  - [x] フィルタはチップ表示・適用中条件が常時見える。
  - [x] ワンタップ解除を提供。

---

## 8. アクセシビリティと操作性改善

**目的:** タップ精度・視認性・アクセシビリティ向上。

### タスク
- [x] タップ領域 44px 以上の確保（全主要操作）。
- [x] コントラスト / Dynamic Type / VoiceOver ラベルの見直し。
- [x] ハプティクス（成功/失敗）追加。

---

## 9. Parity & 品質ゲート

**目的:** Web と Mobile の完全な機能一致を担保。

### タスク
- [x] `docs/feature_parity.md` の更新
  - [x] 実装後に差分が残る場合は理由を記載。
- [ ] 品質ゲートの実行
  - [x] `npm --workspace apps/mobile run lint`
  - [ ] `npm --workspace apps/mobile run typecheck`（存在する場合）
  - [ ] 該当テスト（存在する場合）
- [ ] 起動確認
  - [ ] Web / Mobile の両方で導線チェックを実施。

---

## 実装順の推奨

1. **ナビゲーション再構成**
2. **Project Top Tabs 化**
3. **Board モバイル最適化**
4. **Issue 詳細の編集強化**
5. **一覧 UI/UX 改善**
6. **Empty / Loading / Error 共通化**
7. **検索体験の強化**
8. **アクセシビリティ改善**
9. **Parity & 品質ゲート**

---

## 完了条件

- Web と Mobile で「同じ導線・同じ操作・同じ結果」が担保されている。
- `docs/feature_parity.md` に差分が残っていない、または意図的差分が明記されている。
- 品質ゲートが通過している。
