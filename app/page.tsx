// ============================================================================
// トップページ = 本棚一覧画面（自分で書く）
// ----------------------------------------------------------------------------
// ログインユーザーが登録した本(user_books)を、本の情報(books)と一緒に一覧表示する。
// ============================================================================

// ----------------------------------------------------------------------------
// 最初に必要なimport
// ----------------------------------------------------------------------------
import Image from "next/image";
import Link from "next/link";
// CSSProperties: styleプロパティに独自CSS変数(--ice-shine-delay)を
// 渡すための型。TypeScriptは標準だと style に "--任意の名前" のような
// キーを許可してくれないので、CSSPropertiesに手動でその型を追加している。
import type { CSSProperties } from "react";
// auth, signIn: 今ログイン中かどうかを調べる関数と、Googleログインを
//               開始するための関数（どちらもheader.tsxで使ったのと同じ）
import { auth, signIn } from "@/auth";
//
// db:        DBクライアント
import { db } from "@/db";
//
// userBooks: db/schema.ts の user_books テーブル定義
import { userBooks } from "@/db/schema";
//
// eq, desc:  SQLの条件・並び順を書くためのヘルパー関数（drizzle-ormから提供）
import { eq, desc } from "drizzle-orm";

// ステータスの内部値(DB上の文字列)と、画面に出す日本語ラベル・バッジ用の
// クラス名(globals.cssの.ice-status-pill--*)を対応付ける表。
const STATUS_LABEL: Record<string, string> = {
    want_to_read: "読みたい",
    reading: "読書中",
    finished: "読了",
};

export default async function Home() {
    // ログイン状態を取得
    const session = await auth();
    // 未ログインの場合はサインイン画面を表示して終了
    if (!session) {
        return (
            <div className="mx-auto flex max-w-5xl flex-col items-center gap-10 px-6 py-20 text-center sm:px-12">
                {/* タイトル部分: アイコン + アプリ名 + キャッチコピー */}
                <div className="flex flex-col items-center gap-4">
                    <svg
                        width="56"
                        height="56"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#bfeaff"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <path d="M4 5.5C4 4.67 4.67 4 5.5 4H11v16H5.5C4.67 20 4 19.33 4 18.5v-13Z"></path>
                        <path d="M20 5.5c0-.83-.67-1.5-1.5-1.5H13v16h5.5c.83 0 1.5-.67 1.5-1.5v-13Z"></path>
                    </svg>
                    <h1 className="text-4xl font-bold">BookShelf</h1>
                    <p className="text-base text-[color:var(--ice-text-muted)]">
                        読んだ本・読みたい本を、ひとつの本棚にまとめて管理しよう
                    </p>
                </div>

                {/* サインインカード */}
                <div className="ice-card w-full max-w-sm items-center gap-4 py-10">
                    <p className="text-xl font-bold">さあ、はじめましょう</p>
                    <p className="text-sm text-[color:var(--ice-text-muted)]">
                        Googleアカウントでログインすると、あなた専用の本棚が作られます
                    </p>
                    <form
                        action={async () => {
                            "use server";
                            await signIn("google");
                        }}
                    >
                        <button type="submit" className="ice-button mt-2">
                            Googleでログイン
                        </button>
                    </form>
                </div>
            </div>
        )
    }
    // ログインしている場合
    // ユーザーが本棚に登録している本をすべて取得
    const myBooks = await db.query.userBooks.findMany({
        where: eq(userBooks.userId, session.user!.id!),
        //「user_idが、今ログイン中のユーザーのidと一致する行だけ」に絞り込む
        with: {
            book: true, // 紐づく books テーブルの情報も一緒に取得する
        },
        orderBy: [
            desc(userBooks.createdAt)
        ]
    })

    if (myBooks.length === 0) {
        return (
            <div className="mx-auto max-w-5xl px-6 py-16 flex flex-col items-center gap-4 text-center sm:px-12">
                <p>本が登録されていません</p>
                {/* 本を検索して本棚に追加する画面(/books/search)への入り口 */}
                <Link href="/books/search" className="ice-button">
                    本を追加する
                </Link>
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-5xl px-6 py-10 flex flex-col gap-8 sm:px-12">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <h2 className="text-2xl font-bold">本棚</h2>
                {/* 本を検索して本棚に追加する画面(/books/search)への入り口 */}
                <Link href="/books/search" className="ice-button">
                    本を追加する
                </Link>
            </div>
            <div className="flex flex-wrap gap-5">
                {myBooks.map((myBook, index) => (
                    <div
                        className="ice-card w-full sm:w-[270px]"
                        key={myBook.book.id}
                        // カードごとに光るタイミングをずらす(0s, 0.5s, 1s, ... を6枚ごとに繰り返す)
                        style={{ "--ice-shine-delay": `${(index % 6) * 0.5}s` } as CSSProperties}
                    >
                        <span className={`ice-status-pill ice-status-pill--${myBook.status} self-start mb-3`}>
                            {STATUS_LABEL[myBook.status]}
                        </span>
                        <div className="ice-cover">
                            {myBook.book.thumbnail_url ? (
                                <Image
                                    src={myBook.book.thumbnail_url}
                                    alt={myBook.book.title}
                                    fill
                                    sizes="(max-width: 640px) 100vw, 270px"
                                    style={{ objectFit: "cover" }}
                                />
                            ) : (
                                <span className="text-4xl font-bold opacity-50">
                                    {myBook.book.title.slice(0, 1)}
                                </span>
                            )}
                        </div>
                        <p className="ice-card-title">{myBook.book.title}</p>
                        <p className="ice-card-author">{myBook.book.author}</p>
                        <p className="ice-card-meta">{myBook.book.published_date}</p>
                        <Link href={`/books/${myBook.id}`} className="ice-button mt-auto">
                            詳細を見る
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    )
}
