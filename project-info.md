# AGENTS.md

このリポジトリは **Web（参照実装）を元に Mobile を作成**しています。  
**Web と Mobile の機能・動作・画面構成の一致（Feature Parity）を最優先**に開発してください。

---

## 0. 最重要ルール（必ず守る）

1) **Web が仕様の一次情報**（source of truth）。Mobile 側は必ず追従する。  
2) 変更は **縦割り（UI→状態→永続化→ナビ→テスト）で小さく**。差分が大きい変更は分割する。  
3) **共通ロジックは packages に集約**（@repo/core / @repo/storage）。アプリ側に複製しない。  
4) **Parity を壊す変更は禁止**：Web に機能追加/仕様変更したら、同PR内で Mobile も同等にする。  
5) 変更後は **lint / typecheck / テスト / 起動確認** を通す（下記「品質ゲート」）。

---

## 1. 開発方針（好ましい手法）

### Parity-Driven Development（推奨）
- 1タスク = 1機能の **Web↔Mobile 同等性** を完成させる単位
- 実装順：  
  (a) 仕様確認（Web挙動）→ (b) 共有モデル/ストレージ整備 → (c) Mobile UI 実装 → (d) 画面遷移/導線 → (e) 回帰確認
- 完了条件（Definition of Done）：
  - Web と Mobile で **同じ導線・同じ操作・同じ結果**（保存/更新/削除/検索/通知/既読など）
  - docs/feature_parity.md の該当項目に差分がない（または「意図的な差」を明記）
  - 品質ゲートを全て通過

### 変更設計の原則
- **UI差は許容するが、情報設計と機能差は許容しない**  
  （例：Drawer vs Fullscreen はOK、ただし表示項目・編集可否・操作結果は一致）
- 型・データ構造変更は、必ず以下を同時に更新：
  - @repo/core（型/定数/ラベル/遷移定義など）
  - @repo/storage（Web永続化 + Mobile永続化の両方）
  - 影響する画面（Web + Mobile）
  - 既存データの互換（マイグレーション/デフォルト）

---

## 2. リポジトリ構造（ざっくり）

- apps/web : Web UI（Vite/React）
- apps/mobile : Mobile UI（Expo / expo-router）
- packages/core : 共通の型・定数・ドメイン定義
- packages/storage : 永続化レイヤ（Web: Dexie / Mobile: expo-sqlite 等）

---

## 3. まず最初に確認する資料

- docs/feature_parity.md（Web→Mobile のルーティング・導線・差分がまとまっている）
- Web 側の同機能の画面/コンポーネント（Mobile 実装の参照元）

---

## 4. よくある差分ポイント（実装時の注意）

- **導線の差**（例：WebのTopBarのグローバル作成、MobileのFAB/各画面ボタン）
  - 「どこから作れるか」「戻り先」「キャンセル」「バリデーション」まで合わせる
- **Setup / 初期化の流れ**
  - Webの「どの画面でもウィザード表示」相当を、Mobileでも実質同等になるように揃える
- **Issue詳細**
  - Drawer/Fullscreen の差はOK。ただし表示フィールド・編集項目・関連リンク（Projectへ遷移等）は一致させる

---

## 5. 作業手順（Codexの動き）

1) **対象機能を特定**（Parity観点で「Webで出来ること」を箇条書き）
2) **影響範囲を列挙**（Web / Mobile / core / storage）
3) **小さなコミット単位**で実装（ただしPRは1機能で完結）
4) **品質ゲート**を実行
5) Parityの観点で **手動確認**（WebとMobileで同じシナリオを再現）
6) docs/feature_parity.md に差分が残る場合は、理由と対応予定を明記

---

## 6. 品質ゲート（必須）

最低限、変更に応じて以下を実行してパスさせる：

- lint（全体 or 影響パッケージ）
- typecheck（全体 or 影響パッケージ）
- unit/integration tests（存在する場合は必ず）
- 起動確認
  - Web: dev server 起動 → 主要導線を1往復
  - Mobile: Expo 起動 → 該当画面の導線を1往復

※ scripts が不足している場合は、まず scripts / eslint / prettier / typecheck を整備してから機能追加する。

---

## 7. 実行コマンド（標準）

### Install
- リポジトリルートで依存関係をインストール

### Mobile（Expo）
- ルートから起動（用意されている場合）： `npm run mobile:start`
- キャッシュクリア： `npm run mobile:clear`
- apps/mobile 直下から： `npx expo start`
- apps/mobile 直下でキャッシュクリア： `npx expo start --clear`

---

## 8. コーディング規約（最低限）

- TypeScript: `any` を増やさない。必要なら型を core に追加。
- UI: 同じ概念は同じ名称（label / status / priority / issueType）を使う
- 共有ロジック:
  - ビジネスルール = packages/core
  - 永続化I/F = packages/storage
  - 画面表示の都合だけ = apps/*

---

## 9. “Parity 破壊” を防ぐチェックリスト（PR提出前）

- [ ] docs/feature_parity.md の該当箇所を確認し、差分がない（または意図的差分を明記）
- [ ] Web と Mobile で同じユーザーストーリーを再現し、結果が一致
- [ ] 追加/変更したフィールドが core / storage / 両アプリに反映
- [ ] lint/typecheck/test が通る
- [ ] エラー時の挙動（空状態/通信なし/例外）が両方で破綻しない

---

## 10. Codexへの注意（運用）

- 破壊的操作（大量削除/リネーム/依存の大幅更新）は避け、必要なら理由を明記して最小差分で行う。
- 仕様が曖昧な場合は「Webの現状挙動」を仕様として採用し、Mobileを合わせる。
- AGENTS.md の指示は最優先。長いセッションで指示が薄れた場合は、作業冒頭でこのファイルを再確認すること。

---
