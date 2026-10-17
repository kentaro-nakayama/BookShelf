# Stella Shelf

🌐 **[https://bookshelf-app-peach.vercel.app](https://bookshelf-app-peach.vercel.app)** で公開中

読んだ本・読みたい本を登録し、読書ステータス・星評価・感想をまとめて管理できる本棚アプリ。書籍情報は楽天ブックスAPI／Google Books APIから自動取得するため、タイトルで検索して選ぶだけで登録できる。書店や移動中にその場で本を登録する使い方を想定し、スマートフォンを第一優先（モバイルファースト）で設計している。

## 主要機能

- **書籍検索・登録**: 楽天ブックスAPIでタイトル検索し、0件ならGoogle Books APIにフォールバック。検索結果を選ぶだけでタイトル・著者・出版社・発売日・表紙画像を自動取得して本棚に登録する
- **読書ステータス管理**: 「読みたい」「読書中」「読了」の3種類。登録後もいつでも変更できる
- **感想・レビュー**: 5段階の星評価と自由記述の感想を記録し、後から編集・削除できる
- **ジャンル分類**: 固定マスタ（小説・ビジネス・自己啓発・技術書・エッセイ・その他）から複数選択。1冊に複数ジャンルを設定できる
- **絞り込み**: 本棚一覧をステータスのタブで絞り込む。絞り込み条件はURLのクエリパラメータ（`?status=reading&genre=3&rating=5`）に保持され、ジャンル・評価もURL指定で効く
- **マイリスト**: 「2026年に読んだ本」のような自由なリストをユーザー自身が作成し、本棚の本を振り分けられる
- **Googleログイン**: Auth.jsによるGoogle OAuthのみ。ユーザーごとに自分専用の本棚を持つ（未ログイン時は本棚関連ページへアクセスできない）
- **夜空のUI**: 星空と4つの星座（北斗七星・蠍座・獅子座・カシオペヤ座）をCSSとSVGだけで描いた背景。ナビはスマホでは画面下部のタブバー、PCではヘッダー内のメニューに切り替わる

## 画面紹介

### ホーム（ダッシュボード）・本棚一覧

ホームは「読書中の本」と「最近追加した本」だけを抜粋したダッシュボードで、アプリを開いてすぐ読みかけの本に辿れる。本棚一覧では登録した全冊をカードで並べ、ステータスのタブで絞り込める。

<img src="docs/screenshots/home.jpg" width="600" alt="ホーム画面">
<img src="docs/screenshots/books-list.jpg" width="600" alt="本棚一覧画面">

### 書籍検索・登録

タイトルで検索すると楽天ブックスAPIの結果が並び、ヒットしない場合はGoogle Books APIの結果にフォールバックする。選んだ本はステータス・評価・感想・ジャンルを設定して本棚に登録する。

<img src="docs/screenshots/book-search.jpg" width="600" alt="書籍検索画面">
<img src="docs/screenshots/book-add.jpg" width="600" alt="本を追加する画面">

### 本の詳細・感想編集

登録した本の詳細画面では、ステータス・星評価・感想・ジャンル・所属リストをまとめて更新できる。本棚から削除することも可能。

<img src="docs/screenshots/book-detail.jpg" width="600" alt="本の詳細・感想編集画面">

### マイリスト

ジャンルとは別に、ユーザーが自由に作れるリスト。名前と説明を付けて作成し、本の編集画面からチェックボックスで振り分ける。

<img src="docs/screenshots/my-lists.jpg" width="600" alt="マイリスト画面">

### アカウント

Googleアカウントのプロフィールと、ステータス別の登録冊数を表示する。冊数のバッジを押すと、そのステータスで絞り込んだ本棚一覧が開く。

<img src="docs/screenshots/account.jpg" width="600" alt="アカウント画面">

## 技術スタック

| レイヤー | 技術 |
|---|---|
| フレームワーク | Next.js 16（App Router）+ React 19 + TypeScript |
| UI | Tailwind CSS v4 + shadcn/ui + Base UI + lucide-react |
| フォント | `next/font`（Cormorant Garamond / Zen Old Mincho / Geist Mono） |
| DB | Neon Postgres（Vercel Marketplace経由でプロビジョニング）+ Drizzle ORM |
| 認証 | Auth.js（NextAuth v5）+ `@auth/drizzle-adapter`、Google OAuth |
| 書籍検索API | 楽天ブックスAPI（優先）→ 0件時に Google Books API へフォールバック |
| ホスティング | Vercel（デプロイ先: [bookshelf-app-peach.vercel.app](https://bookshelf-app-peach.vercel.app)） |

## セットアップ

### 前提条件

- Node.js
- [Vercel CLI](https://vercel.com/docs/cli)（`vercel link` でプロジェクトをリンク済みであること）

### 手順

1. 依存パッケージをインストール

   ```bash
   npm install
   ```

2. 環境変数を同期

   Neon（DB）はVercel Marketplace経由でプロビジョニングされており、各APIキーもVercelの環境変数に登録済みのため、`vercel env pull` で一括同期できる。

   ```bash
   vercel env pull .env.local
   ```

   新しく発行し直す場合の取得元は次のとおり。

   | 環境変数 | 取得元 |
   |---|---|
   | `DATABASE_URL` / `DATABASE_URL_UNPOOLED` | Neon（Vercel Marketplace）。アプリの通常クエリはプール接続、マイグレーションは`_UNPOOLED`を使う |
   | `AUTH_SECRET` | `npx auth secret` で生成 |
   | `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | [Google Cloud Console](https://console.cloud.google.com/apis/credentials)のOAuthクライアント。リダイレクトURIに `http://localhost:3000/api/auth/callback/google` を登録する |
   | `RAKUTEN_APPLICATION_ID` / `RAKUTEN_ACCESS_KEY` | [楽天ウェブサービス](https://webservice.rakuten.co.jp/)でアプリ登録。「許可されたWebサイト」にローカル用・本番用ドメインを登録する |
   | `GOOGLE_BOOKS_API_KEY` | Google Cloud ConsoleでBooks APIを有効化して発行 |

   なお `drizzle-kit`（マイグレーション）とシードスクリプトは `.env` の `DATABASE_URL` / `DATABASE_URL_UNPOOLED` を読む。

3. マイグレーションと初期データを適用

   ジャンルは固定マスタなので、シードを流さないとジャンル欄が空になる。

   ```bash
   npm run db:migrate
   npm run db:seed
   ```

4. 開発サーバーを起動

   ```bash
   npm run dev
   ```

   [http://localhost:3000](http://localhost:3000) を開く。

## 主なコマンド

| コマンド | 内容 |
|---|---|
| `npm run dev` | 開発サーバーを起動 |
| `npm run build` | 本番ビルド |
| `npm run start` | 本番サーバーを起動 |
| `npm run lint` | ESLintを実行 |
| `npm run db:generate` | スキーマからマイグレーションファイルを生成 |
| `npm run db:migrate` | マイグレーションを適用 |
| `npm run db:seed` | ジャンルの初期データを投入（再実行しても安全） |
| `npm run db:studio` | Drizzle StudioでDBの中身を確認 |

## ディレクトリ構成（抜粋）

```
app/            # ルーティング（App Router）・Server Actions
├── books/      # 本棚一覧・書籍検索・追加・詳細
├── list/       # マイリスト
└── account/    # アカウント
components/     # UIコンポーネント
db/             # Drizzleスキーマ・DBクライアント・シード
drizzle/        # 生成されたマイグレーションSQL
lib/books/      # 楽天ブックス／Google Books APIの呼び出しとフォールバック
docs/           # 要件定義書・DB設計書
auth.ts         # Auth.js（Google OAuth）の設定
```

## ドキュメント

- [docs/requirements.md](./docs/requirements.md): 要件定義書（機能要件・技術スタックの選定理由）
- [docs/database-design.md](./docs/database-design.md): データベース設計書（テーブル定義・設計の考え方）
