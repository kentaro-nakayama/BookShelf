// ============================================================================
// トップページ = ホーム（ダッシュボード）
// ----------------------------------------------------------------------------
// 以前はこのページが本棚の全件一覧だったが、グローバルナビの「ホーム」と
// 「リスト」で役割を分けたため、次のように変更した。
//   ホーム(/)      … 読書中の本・最近追加した本だけを抜粋したダッシュボード。
//                    アプリを開いてすぐ「読みかけの本の続き」に辿れるようにする。
//   リスト(/books) … 全件一覧 + ステータス/ジャンル/評価での絞り込み。
// ============================================================================

import Link from "next/link";
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
// BookCard: 本棚カード1枚分の表示部品（リスト画面と共通）
// BookStatus: "want_to_read" | "reading" | "finished" のいずれかを表す型
import BookCard, { type BookStatus } from "@/components/book-card";

// ホームに「最近追加した本」として並べる最大枚数。
// これを超える分は「リスト」画面で見てもらう。
const RECENT_LIMIT = 6;

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
    // ユーザーが本棚に登録している本をすべて取得（新しく登録した順）
    //
    // 「読書中だけ」「最近の6冊だけ」をそれぞれSQLで取りに行くこともできるが、
    // そうするとDBへの問い合わせが複数回になる。個人〜小規模利用（要件定義書8章）
    // で1人の蔵書は多くても数百冊程度なので、1回でまとめて取得してから
    // JavaScript側で振り分けるほうが単純で速い。
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

    // 1冊も登録がない場合は、本を追加する導線だけを見せる
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

    // ステータス別に件数を数える。
    // filter()は「条件に合う要素だけの新しい配列」を作る関数なので、
    // その配列の長さ(length)がそのまま件数になる。
    const readingBooks = myBooks.filter((myBook) => myBook.status === "reading");
    const wantToReadCount = myBooks.filter(
        (myBook) => myBook.status === "want_to_read",
    ).length;
    const finishedCount = myBooks.filter(
        (myBook) => myBook.status === "finished",
    ).length;

    // 最近追加した本。myBooksはcreatedAtの降順で取得しているので、
    // 先頭からRECENT_LIMIT件を切り出せば「新しい順の6冊」になる。
    // slice()は元の配列を変更せず、切り出した新しい配列を返す。
    const recentBooks = myBooks.slice(0, RECENT_LIMIT);

    // 件数バッジ（「読みたい 3冊」など）の定義。
    // href先にクエリパラメータ(?status=...)を付けておくと、
    // リスト画面がそれを読み取って最初から絞り込んだ状態で開く。
    const statusSummary = [
        { status: "want_to_read", label: "読みたい", count: wantToReadCount },
        { status: "reading", label: "読書中", count: readingBooks.length },
        { status: "finished", label: "読了", count: finishedCount },
    ];

    return (
        <div className="mx-auto max-w-5xl px-6 py-10 flex flex-col gap-10 sm:px-12">
            {/* --- あいさつ + ステータス別の件数 ------------------------------ */}
            <div className="flex flex-col gap-4">
                <h2 className="text-2xl font-bold">
                    {/* Googleアカウントの表示名が取れない場合もあるので、
                        その場合は名前なしの文面にフォールバックする */}
                    {session.user?.name
                        ? `${session.user.name} さんの本棚`
                        : "あなたの本棚"}
                </h2>
                <div className="flex flex-wrap gap-2">
                    {statusSummary.map((summary) => (
                        <Link
                            key={summary.status}
                            href={`/books?status=${summary.status}`}
                            className={`ice-status-pill ice-status-pill--${summary.status}`}
                        >
                            {summary.label} {summary.count}冊
                        </Link>
                    ))}
                </div>
            </div>

            {/* --- 読書中の本 ------------------------------------------------ */}
            <section className="flex flex-col gap-5">
                <h3 className="text-xl font-bold">読書中</h3>
                {readingBooks.length === 0 ? (
                    <p className="text-sm text-[color:var(--ice-text-muted)]">
                        読書中の本はありません。リストから本のステータスを
                        「読書中」に変えると、ここに表示されます。
                    </p>
                ) : (
                    <div className="flex flex-wrap gap-5">
                        {readingBooks.map((myBook, index) => (
                            <BookCard
                                key={myBook.id}
                                userBookId={myBook.id}
                                title={myBook.book.title}
                                author={myBook.book.author}
                                publishedDate={myBook.book.published_date}
                                thumbnailUrl={myBook.book.thumbnail_url}
                                // DBのstatusカラムの型はBookStatusと同じ3値だが、
                                // Drizzleの型とこちらで定義した型を結びつけるために
                                // 明示的に型を指定している
                                status={myBook.status as BookStatus}
                                index={index}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* --- 最近追加した本 -------------------------------------------- */}
            <section className="flex flex-col gap-5">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <h3 className="text-xl font-bold">最近追加した本</h3>
                    {/* 抜粋しか出していないので、全件はリスト画面へ案内する */}
                    <Link
                        href="/books"
                        className="text-sm font-semibold text-[color:var(--ice-text-muted)] underline"
                    >
                        すべて見る（{myBooks.length}冊）
                    </Link>
                </div>
                <div className="flex flex-wrap gap-5">
                    {recentBooks.map((myBook, index) => (
                        <BookCard
                            key={myBook.id}
                            userBookId={myBook.id}
                            title={myBook.book.title}
                            author={myBook.book.author}
                            publishedDate={myBook.book.published_date}
                            thumbnailUrl={myBook.book.thumbnail_url}
                            status={myBook.status as BookStatus}
                            index={index}
                        />
                    ))}
                </div>
            </section>
        </div>
    )
}
