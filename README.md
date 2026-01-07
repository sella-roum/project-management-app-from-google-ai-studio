# Project Management App (Web + Mobile)

このリポジトリは **Web（Vite + React）** と **Mobile（Expo + React Native）** を同一コードベースで管理するための構成です。

- Web: `apps/web`
- Mobile: `apps/mobile`（Expo Router採用）
- 共有ロジック: `packages/*`（例: `@repo/core`, `@repo/storage`）

---

## 必要要件

- Node.js（推奨: LTS）
- npm（または pnpm/yarn を使う場合はプロジェクト方針に合わせてください）
- Mobile を実機で動かす場合:
  - Expo Go（iOS/Android）
  - もしくは Android Studio / Xcode（エミュレータ/シミュレータ）

---

## セットアップ（最初に1回）

リポジトリの **ルート** で依存関係を入れます。

```bash
npm install
````

---

## Web アプリの起動（apps/web）


起動:

```bash
cd apps/web
npm run dev
```

* ブラウザで Vite の表示URLにアクセスしてください
* ルート要素 `#root` に React がマウントされます（Webは `apps/web/src/index.tsx` でマウント）

---

## Mobile アプリの起動（apps/mobile）

### もっとも確実な起動方法（推奨）

```bash
cd apps/mobile
npx expo start
```

* 表示されたQRを Expo Go で読み取り（同一LAN推奨）
* またはターミナルで `a`（Android）/ `i`（iOS）を押して起動

補足:

* キャッシュが怪しい時は `--clear` を付けてください

```bash
npx expo start --clear
```

---

## よくあるトラブルシュート

### 1) `ルートファイルが見つからない` / `Root file specified in package.json does not exist`

この系統は **起動ディレクトリ違い** または **Expo Router のエントリ設定不整合** が多いです。

**チェック順（上から順に）**

1. **必ず `apps/mobile` で起動しているか**

   * ✅ `cd apps/mobile && npx expo start`
   * ❌ リポジトリルートで `npm run start`（Webのstartや別設定が走る可能性）

2. `apps/mobile` に `app/_layout.tsx` と `app/index.tsx`（またはルートとなる画面）が存在するか

   * Expo Router は `app/` 配下をルーティングの起点として使います

3. `apps/mobile/package.json` の `main` が Expo Router のエントリになっているか

   * 目安: `"main": "expo-router/entry"`

4. `apps/mobile/app.json`（または `app.config.*`）で Expo Router プラグインが有効になっているか

   * 目安: `"plugins": ["expo-router", ...]`

5. `apps/mobile/babel.config.js` に Expo Router の設定が入っているか

   * 目安: `plugins: ["expo-router/babel"]`

6. それでもダメならキャッシュ削除

   * `npx expo start --clear`
   * `apps/mobile/node_modules` を消して入れ直し（必要ならルートからやり直し）

---

### 2) 依存解決できない（例: `@repo/core` が見つからない / TS Path が解決しない）

* まずはルートで `npm install` を再実行してください
* モノレポ構成の場合、Metro の解決設定（`apps/mobile/metro.config.js`）が重要です
  → `apps/mobile` 側で起動しても解決しない時は、`metro.config.js` と `tsconfig` の paths を確認してください

---

### 3) うっかり `reset-project` を実行してしまった

`apps/mobile/scripts/reset-project.js` は **app/ 等を退避 or 削除して、空の雛形に戻す** ためのスクリプトです。
意図せず実行するとルーティング構造が変わり、起動エラーの原因になります。

* 心当たりがある場合:

  * `app-example/` ができていないか
  * `app/` 配下の画面が消えていないか
  * Git で差分を確認して戻してください

---

## 開発メモ

* Web と Mobile のUIは現状別実装（ただしデータ/ロジックは `packages/*` で共有可能）
* Mobile は Expo Router のため、画面は `apps/mobile/app/**` に追加していきます

---

## コマンド早見表

```bash
# 依存導入
npm install

# Web
cd apps/web
npm run dev

# Mobile
cd apps/mobile
npx expo start
# キャッシュクリア
npx expo start --clear
```
