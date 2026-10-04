// ============================================================================
// リスト画面 = 本棚の全件一覧（自分で書く）
// ----------------------------------------------------------------------------
// URL: /books
//
// ホーム(/)が「読書中・最近追加」の抜粋だったのに対し、こちらは登録した本の
// 全件を並べ、ステータス・ジャンル・評価で絞り込める画面（要件定義書5.3）。
//
// 設計方針:
//   絞り込み条件はURLのクエリパラメータ(?status=reading&genre=3&rating=5)として
//   持たせる。書籍検索画面(/books/search)と同じ考え方で、
//     - 条件を変えるだけならクライアント側のJavaScriptが不要（リンクとフォームで済む）
//     - 絞り込んだ状態のURLをブックマーク・共有できる
//     - ブラウザの「戻る」で前の絞り込み条件に戻れる
//   という利点がある。
// ============================================================================

import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/db";
import { userBooks, userBookGenres, genres } from "@/db/schema";
// and:      複数の条件を「かつ」でつなぐ（WHERE A AND B）
// eq:       等しい（WHERE col = value）
// desc:     降順の並び替え（ORDER BY col DESC）
// inArray:  値がリストに含まれるか（WHERE col IN (...)）。
//           リストの代わりに「別のSELECT文」を渡すこともできる（下のジャンル絞り込みで使用）
import { and, eq, desc, inArray } from "drizzle-orm";
import BookCard, { STATUS_LABEL, type BookStatus } from "@/components/book-card";

// ステータス絞り込みのタブに出す選択肢。
// status: undefined は「すべて」（＝ステータスで絞り込まない）を意味する。
const STATUS_TABS: { status?: BookStatus; label: string }[] = [
    { status: undefined, label: "すべて" },
    { status: "want_to_read", label: STATUS_LABEL.want_to_read },
    { status: "reading", label: STATUS_LABEL.reading },
    { status: "finished", label: STATUS_LABEL.finished },
];

// 絞り込み条件からURLを組み立てる。
// 例: { status: "reading", genreId: 3 } → "/books?status=reading&genre=3"
//
// なぜ関数にしたのか:
//   ステータスのタブを押したときに、せっかく選んでいたジャンルや評価の条件が
//   消えてしまわないようにしたい。そのため「今の条件のうち、変えたいものだけ
//   差し替えたURL」を作れるようにしている。
// URLSearchParams: "a=1&b=2" のようなクエリ文字列を安全に組み立てる標準の仕組み。
//   日本語などURLに直接書けない文字のエスケープも自動でやってくれる。
function buildFilterHref(filters: {
    status?: BookStatus;
    genreId?: number;
    rating?: number;
}) {
    const searchParams = new URLSearchParams();
    if (filters.status) searchParams.set("status", filters.status);
    if (filters.genreId) searchParams.set("genre", String(filters.genreId));
    if (filters.rating) searchParams.set("rating", String(filters.rating));

    const queryString = searchParams.toString();
    // 条件が何もない場合に "/books?" という中途半端なURLにならないよう分岐する
    return queryString ? `/books?${queryString}` : "/books";
}

export default async function BooksPage({ searchParams }: PageProps<"/books">) {
    const session = await auth();
    // 未ログイン時は本棚の中身を見せない（要件定義書8章）。
    // ホーム画面にログインの導線があるので、そちらへ案内する。
    if (!session) {
        return (
            <div className="mx-auto max-w-5xl px-6 py-16 flex flex-col items-center gap-4 text-center sm:px-12">
                <p>本棚を見るにはログインが必要です</p>
                <Link href="/" className="ice-button">
                    ホームへ
                </Link>
            </div>
        );
    }

    // Next.js 16ではsearchParamsがPromiseなのでawaitして中身を取り出す
    const params = await searchParams;

    // --- クエリパラメータの検証 ---------------------------------------------
    // URLは誰でも手で書き換えられるので、受け取った値をそのままSQLの条件に
    // 使ってはいけない。「想定した値のどれかであること」を確かめ、
    // 違っていたら「絞り込みなし(undefined)」として扱う。

    // ステータス: STATUS_LABELのキー(3種類)のどれかであること
    const rawStatus = typeof params.status === "string" ? params.status : "";
    const statusFilter = (
        rawStatus in STATUS_LABEL ? rawStatus : undefined
    ) as BookStatus | undefined;

    // ジャンル: 数値に変換できること（できなければNumber()はNaNを返す）。
    // Number.isInteger()はNaNに対してfalseを返すので、これ1つで
    // 「数値であり、かつ整数である」を確認できる。
    const rawGenre = typeof params.genre === "string" ? Number(params.genre) : NaN;
    const genreFilter = Number.isInteger(rawGenre) ? rawGenre : undefined;

    // 評価: 1〜5の整数であること（要件定義書5.5の星5段階）
    const rawRating = typeof params.rating === "string" ? Number(params.rating) : NaN;
    const ratingFilter =
        Number.isInteger(rawRating) && rawRating >= 1 && rawRating <= 5
            ? rawRating
            : undefined;

    // --- WHERE条件の組み立て ------------------------------------------------
    // 条件を配列に詰めていき、最後にand(...)でまとめる。
    // 「指定されていない条件は配列に入れない」ことで、
    // if文でクエリを何パターンも書き分ける必要がなくなる。
    const conditions = [eq(userBooks.userId, session.user!.id!)];

    if (statusFilter) {
        conditions.push(eq(userBooks.status, statusFilter));
    }

    if (ratingFilter) {
        conditions.push(eq(userBooks.rating, ratingFilter));
    }

    if (genreFilter) {
        // ジャンルは user_book_genres という中間テーブルに入っているため、
        // user_booksの列を直接比較するだけでは絞り込めない。
        // そこで「このジャンルが付いている user_book_id の一覧」を別のSELECTで作り、
        // 「user_books.id がその一覧に含まれるもの」という条件にしている。
        // 生成されるSQLのイメージ:
        //   WHERE user_books.id IN (
        //     SELECT user_book_id FROM user_book_genres WHERE genre_id = 3
        //   )
        conditions.push(
            inArray(
                userBooks.id,
                db
                    .select({ userBookId: userBookGenres.userBookId })
                    .from(userBookGenres)
                    .where(eq(userBookGenres.genreId, genreFilter)),
            ),
        );
    }

    // --- データ取得 ---------------------------------------------------------
    // 本の一覧と、ジャンル絞り込み用の選択肢(genresマスタ)を取得する。
    // この2つは互いに結果を必要としないので、Promise.allで同時に実行して
    // 待ち時間を短くしている（順番に待つと2回分の時間がかかる）。
    const [myBooks, allGenres] = await Promise.all([
        db.query.userBooks.findMany({
            where: and(...conditions),
            with: { book: true },
            orderBy: [desc(userBooks.createdAt)],
        }),
        db.select().from(genres).orderBy(genres.id),
    ]);

    // 絞り込みが1つでも掛かっているか。
    // 「0件です」と出すときに、「まだ1冊も登録していない」のか
    // 「条件に合う本がなかった」のかで案内を変えるために使う。
    const hasFilter = Boolean(statusFilter || genreFilter || ratingFilter);

    return (
        <div className="mx-auto max-w-5xl px-6 py-10 flex flex-col gap-6 sm:px-12">
            <h2 className="text-xl font-bold">本棚</h2>

            {/* --- ステータスのタブ ------------------------------------------ */}
            {/* <select>ではなくリンクのタブにしているのは、一番よく使う絞り込みで
                あり、スマホでも1タップで切り替えられるようにしたいため。
                hrefには今のジャンル・評価の条件をそのまま引き継がせている。 */}
            <div className="ice-filter-tabs">
                {STATUS_TABS.map((tab) => {
                    const active = statusFilter === tab.status;
                    return (
                        <Link
                            key={tab.label}
                            href={buildFilterHref({
                                status: tab.status,
                                genreId: genreFilter,
                                rating: ratingFilter,
                            })}
                            className={`ice-filter-tab${active ? " ice-filter-tab--active" : ""}`}
                            aria-current={active ? "page" : undefined}
                        >
                            {tab.label}
                        </Link>
                    );
                })}
            </div>

            {/* --- 件数 ------------------------------------------------------ */}
            <p className="text-sm text-[color:var(--ice-text-muted)]">
                {myBooks.length}冊
                {hasFilter && "（絞り込み中）"}
            </p>

            {/* --- 一覧 ------------------------------------------------------ */}
            {myBooks.length === 0 ? (
                <div className="flex flex-col items-center gap-4 py-10 text-center">
                    {hasFilter ? (
                        <>
                            <p>条件に合う本がありません</p>
                            <Link href="/books" className="ice-button">
                                条件をクリアする
                            </Link>
                        </>
                    ) : (
                        <>
                            <p>本が登録されていません</p>
                            <Link href="/books/search" className="ice-button">
                                本を追加する
                            </Link>
                        </>
                    )}
                </div>
            ) : (
                <div className="flex flex-wrap gap-5">
                    {myBooks.map((myBook, index) => (
                        <BookCard
                            key={myBook.id}
                            href={`/books/${myBook.id}`}
                            title={myBook.book.title}
                            author={myBook.book.author}
                            publishedDate={myBook.book.published_date}
                            thumbnailUrl={myBook.book.thumbnail_url}
                            status={myBook.status as BookStatus}
                            index={index}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
