// ============================================================================
// Drizzle スキーマ定義ファイル
// ----------------------------------------------------------------------------
// ここに書いたテーブル定義が「アプリが期待するDBの形」の正解(ソース・オブ・トゥルース)になる。
// 設計内容は docs/database-design.md を参照。
// ============================================================================

import { pgTable, integer, text, smallint, date, timestamp, uuid, pgEnum, uniqueIndex, index, primaryKey } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// genres: 固定ジャンルマスタ（ユーザーは追加不可、開発者がseedで管理）
export const genres = pgTable('genres', {
    id: smallint('id').primaryKey(),
    name: text('name').notNull().unique(),
});

// books: 外部APIから取得した書籍情報のキャッシュ（複数ユーザーで共有）
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
// users / accounts / sessions（Auth.js標準スキーマ）
// ----------------------------------------------------------------------------
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

// user_books: 本棚の中心テーブル（ユーザー×本の登録情報）
// user_book_genres: user_books と genres の多対多中間テーブル
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

// relationの定義
export const userBooksRelations = relations(userBooks, ({ one }) => ({
    // userBooksテーブルとbooksテーブルのリレーションを定義
    // userBooksから見て，booksの情報は1対1の関係になる
    book: one(books, {
        // userBooks.bookId が参照する books.id を指定
        fields: [userBooks.bookId], 
        references: [books.id],
    }),
}));