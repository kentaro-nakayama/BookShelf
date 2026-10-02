// ============================================================================
// DBクライアント定義ファイル（自分で書く）
// ----------------------------------------------------------------------------
// アプリから実際にDBへクエリを投げるときに使う「DBクライアント」を作る場所。
// 例: `import { db } from "@/db"; await db.select().from(genres);`
//
// Next.jsのサーバー側コード(Server Components / Route Handlers / Server Actions)
// からはこの `db` をimportして使う想定（ブラウザ側のコードからは使わない）。
// ============================================================================

// ----------------------------------------------------------------------------
// 最初に必要なimport
// ----------------------------------------------------------------------------
// neon: NeonのHTTP経由ドライバ（サーバーレス環境向けの軽量な接続方法）
import { neon } from "@neondatabase/serverless";
//
// drizzle: Drizzle側のNeon用アダプタ。上のneonドライバをDrizzleのAPIで
// 扱えるようにラップしてくれる
import { drizzle } from "drizzle-orm/neon-http";
//
// schema: db/schema.ts で定義したテーブル定義一式。まとめてimportしておくと、
// 後で `db.query.userBooks.findMany({ with: { book: true } })` のように
// リレーション込みの書き方ができるようになる
import * as schema from "./schema";

// ----------------------------------------------------------------------------
// TODO: DBクライアントを作る
// ----------------------------------------------------------------------------
// 手順:
//   1. neon(接続文字列) を呼んで「DBとの接続」オブジェクトを作る
//      → 接続文字列は process.env.DATABASE_URL を使う
//        （DATABASE_URL_UNPOOLED ではない点に注意。drizzle.config.ts の
//          マイグレーション専用接続とは違い、アプリの通常クエリは
//          「プールされた」接続(DATABASE_URL)を使うのが推奨だった）
//   2. drizzle(①の接続, { schema }) を呼んで、Drizzleのクライアントを作る
//   3. それを `db` という名前で export する（他のファイルから
//      `import { db } from "@/db"` で使えるように）
//
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    throw new Error("DATABASE_URLが設定されていません. 環境変数ファイルを確認してください.");
}

const connection = neon(databaseUrl);
export const db = drizzle(connection, { schema });
