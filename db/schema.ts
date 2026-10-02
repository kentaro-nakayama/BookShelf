// ============================================================================
// Drizzle スキーマ定義ファイル（自分で書く）
// ----------------------------------------------------------------------------
// ここに書いたテーブル定義が「アプリが期待するDBの形」の正解(ソース・オブ・トゥルース)になる。
// 設計内容は docs/database-design.md を参照。
//
// 進め方のおすすめ:
//   1. genres（一番シンプル：外部キーなし、カラム2つ）から書いてみる
//   2. books（外部キーなし、カラムは多いがシンプル）
//   3. users / accounts / sessions（Auth.js用の決まったスキーマ、最後でOK）
//   4. user_books / user_book_genres（外部キーあり、他のテーブルを定義してから）
// ============================================================================

// ----------------------------------------------------------------------------
// 最初に必要なimport
// ----------------------------------------------------------------------------
// pgTable: テーブルを1つ定義するための関数（これが基本の型）
// 型(integer, text 等): 使うカラムの型だけ、その都度ここに追加していく
//
import { pgTable, integer, text, smallint, date, timestamp, uuid, pgEnum, uniqueIndex, index, primaryKey } from "drizzle-orm/pg-core";

// ----------------------------------------------------------------------------
// pgTable の基本形
// ----------------------------------------------------------------------------
// export const 変数名 = pgTable("実際のテーブル名(DB上の名前)", {
//   カラム名: 型("DB上のカラム名").制約1().制約2(),
//   ...
// });

// ----------------------------------------------------------------------------
// TODO 1: genres テーブル（docs/database-design.md 2.6節を参照）
// ----------------------------------------------------------------------------
// 必要なカラム:
//   - id:   smallint（integer型を使う）, 主キー(primaryKey)
//   - name: text, NOT NULL(notNull), UNIQUE(unique)
//
// ヒント: カラムの型のあとに .notNull() や .unique() や .primaryKey() を
//        メソッドチェーンでつなげていく書き方になる。
//

export const genres = pgTable('genres', {
    id: smallint('id').primaryKey(),
    name: text('name').notNull().unique(),
});

// ----------------------------------------------------------------------------
// TODO 2: books テーブル（外部キーなし）
// ----------------------------------------------------------------------------
// genres が書けたら次はこちら。docs/database-design.md 2.4節を参照。
export const EnumExternalSource = pgEnum('enum_external_source', ['rakuten', 'google']);

export const books = pgTable('books', {
    id: uuid('id').primaryKey().defaultRandom(),
    external_source: EnumExternalSource('external_source').notNull(),
    external_id: text('external_id').notNull(),
    isbn: text('isbn'),
    title: text('title').notNull(),
    author: text('author'),
    publisher: text('publisher'),
    published_date: date('published_date'),
    thumbnail_url: text('thumbnail_url'),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
},
// ----------------------------------------------------------------------------
// pgTable の第3引数: 複数カラムにまたがる制約(複合UNIQUE・複合主キー・通常の
// インデックスなど)をまとめて書く場所。
//
// 書き方: (table) => { ... return [ 制約1, 制約2, ... ]; }
//   - 第1引数 table には、上で定義したカラムたちが入っている
//     （table.カラム名 で参照できる）
//   - 戻り値は「制約の配列」。波かっこ{ }を使う場合は return を忘れると
//     何も返らず型エラーになるので注意（(table) => [ ... ] と書けば
//     returnを省略できる）
//
// uniqueIndex('制約名(自由に命名可)').on(カラムA, カラムB)
//   → カラムA・カラムBの「組み合わせ」が重複してはいけない、という制約。
//     片方のカラムだけの .unique() とは違い、複数カラムをまたいだ
//     重複チェックをしたいときに使う。
// ----------------------------------------------------------------------------
(table) => {
    // 複合ユニーク制約: external_source + external_id
    // （例: 楽天の"123"番とGoogle Booksの"123"番は別の本だが、
    //   楽天の"123"番が2重に登録されるのは防ぎたい）
    return [uniqueIndex('books_external_source_external_id_unique').on(table.external_source, table.external_id)]
});

// ----------------------------------------------------------------------------
// TODO 3: users / accounts / sessions（Auth.js標準スキーマ）
// ----------------------------------------------------------------------------
// docs/database-design.md 2.1〜2.3節を参照。カラム名・型を変えてはいけない
// （Auth.jsのアダプタが前提にしている形だから）。
//
// ここは books と違って「自分で自由に設計していい部分」ではなく、
// 後で導入する @auth/drizzle-adapter というアダプタが「このプロパティ名で
// アクセスできるはず」と決め打ちしてくる契約。なので
//   - JS側のプロパティ名(左側)は camelCase で決め打ち（userId, sessionToken 等）
//   - DB側のカラム名(文字列の引数)は snake_case で決め打ち（user_id 等）
// という組み合わせを変えずにそのまま使う。

// users: ログインユーザーそのものの情報
export const users = pgTable("users", {
    // defaultRandom(): DB側でランダムなUUIDを自動生成（＝新規作成時にidを指定しなくていい）
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name"), // Googleアカウントの表示名。NULL許可
    email: text("email").notNull().unique(), // ログインの鍵になるので重複禁止
    // Googleログインの場合、ログイン成功時にAuth.jsが自動でこの日時を入れる
    emailVerified: timestamp("email_verified", { withTimezone: true }),
    image: text("image"), // プロフィール画像のURL
});

// accounts: 「どのユーザーが、どの外部サービス(Google等)と連携しているか」の情報
export const accounts = pgTable(
    "accounts",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        // users.id への外部キー。ユーザーが消えたら連携情報も一緒に消す(cascade)
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        type: text("type").notNull(), // "oauth" 固定（今回はGoogleのみ使うため）
        provider: text("provider").notNull(), // "google" 固定
        providerAccountId: text("provider_account_id").notNull(), // Google側のアカウントID
        // 以下はOAuthのトークン情報。Auth.jsが自動的に読み書きする。
        // ※ ここだけ意図的にTSのプロパティ名もsnake_caseにしている。
        //   @auth/drizzle-adapter（DrizzleAdapterの型定義）が、この6項目に関しては
        //   「プロパティ名そのもの」がsnake_caseであることを前提にしているため
        //   （NextAuth v4時代からの命名を引き継いだ、アダプタ側の歴史的な仕様）。
        //   他のカラム(userId, providerAccountId等)はcamelCaseのままでよい。
        refresh_token: text("refresh_token"),
        access_token: text("access_token"),
        expires_at: integer("expires_at"),
        token_type: text("token_type"),
        scope: text("scope"),
        id_token: text("id_token"),
        session_state: text("session_state"),
    },
    (table) => [
        // 同じGoogleアカウントで二重にレコードができないようにする一意制約
        uniqueIndex("accounts_provider_account_unique").on(
            table.provider,
            table.providerAccountId,
        ),
    ],
);

// sessions: 「誰が、いつまでログイン状態が有効か」を表すテーブル
// ※ 独立したid(uuid)は持たない。@auth/drizzle-adapterは「sessionToken自体が
//   主キー」という前提の設計になっているため、それに合わせている。
export const sessions = pgTable("sessions", {
    sessionToken: text("session_token").primaryKey(), // ブラウザのCookieに保存される鍵＝主キー
    userId: uuid("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { withTimezone: true }).notNull(), // セッションの有効期限
});

// ----------------------------------------------------------------------------
// TODO 4: user_books / user_book_genres（外部キーあり）
// ----------------------------------------------------------------------------
// 他のテーブルの変数（users, books, genres など）を .references(() => xxx.id)
// のように参照する形になる。docs/database-design.md 2.5, 2.7節を参照。
export const EnumStatus = pgEnum('enum_status', ['want_to_read', 'reading', 'finished']);

export const userBooks = pgTable('user_books', {
    id: uuid('id').notNull().defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: "cascade" }),
    bookId: uuid('book_id').notNull().references(() => books.id, { onDelete: "restrict" }),
    status: EnumStatus('status').notNull().default('want_to_read'),
    rating: smallint('rating'),
    reviewText: text('review_text'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    uniqueIndex('user_books_user_id_book_id_unique').on(
        table.userId,
        table.bookId,
    ),
    index('user_books_user_id_index').on(table.userId),
    index('user_books_user_id_status_index').on(table.userId, table.status),
]);

export const userBookGenres = pgTable('user_book_genres', {
    userBookId: uuid('user_book_id').notNull().references(() => userBooks.id, { onDelete: "cascade" }),
    genreId: smallint('genre_id').notNull().references(() => genres.id, { onDelete: "restrict" }),
}, (table) => [
    primaryKey({ columns: [table.userBookId, table.genreId] }), 
    index('user_book_genres_user_book_id_index').on(table.userBookId),
    index('user_book_genres_genre_id_index').on(table.genreId),
]);