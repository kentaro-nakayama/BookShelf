// ============================================================================
// リストの中身を表示する画面（自分で書く）
// ----------------------------------------------------------------------------
// URL: /list/[id] の [id] は book_lists.id
//
// やること:
//   1. URLのidからリストを取得する（自分のリストでなければ見せない）
//   2. そのリストに入っている本を、本棚の登録情報(user_books)と
//      本の情報(books)込みで取得する
//   3. 本棚と同じ BookCard で並べる
// ============================================================================

import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/db";
import { bookLists, bookListItems } from "@/db/schema";
import { and, eq, asc } from "drizzle-orm";
import BookCard, { type BookStatus } from "@/components/book-card";
import { deleteList } from "../actions";

export default async function ListDetailPage({ params }: PageProps<"/list/[id]">) {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
        return (
            <div className="mx-auto max-w-5xl px-6 py-16 flex flex-col items-center gap-4 text-center sm:px-12">
                <p>ログインしてください</p>
                <Link href="/" className="ice-button">ホームへ</Link>
            </div>
        );
    }

    // 認可チェック: idだけでなく user_id も条件に入れる。
    // これが無いと、他人のリストIDをURLに直接打ち込むだけで中身が見えてしまう。
    const list = await db.query.bookLists.findFirst({
        where: and(eq(bookLists.id, id), eq(bookLists.userId, session.user.id)),
    });
    if (!list) {
        return (
            <div className="mx-auto max-w-5xl px-6 py-16 flex flex-col items-center gap-4 text-center sm:px-12">
                <p>リストが見つかりませんでした</p>
                <Link href="/list" className="ice-button">マイリストへ</Link>
            </div>
        );
    }

    // リストに入っている本を取得する。
    // with をネストすると「item → その本棚登録 → その本」と
    // 2段階たどった情報をまとめて取得できる（db/schema.tsのrelations定義が前提）。
    const items = await db.query.bookListItems.findMany({
        where: eq(bookListItems.bookListId, id),
        with: {
            userBook: {
                with: { book: true },
            },
        },
        // 追加した順に並べる（今回は手動の並び替えは持たない方針）
        orderBy: [asc(bookListItems.addedAt)],
    });

    return (
        <div className="mx-auto max-w-5xl px-6 py-10 flex flex-col gap-7 sm:px-12">
            {/* パンくず代わりの戻り導線 */}
            <Link href="/list" className="ice-back-link">
                ← マイリスト
            </Link>

            <div className="flex flex-col gap-2">
                <h2 className="text-xl font-bold">{list.name}</h2>
                {list.description && (
                    <p className="text-sm text-[color:var(--ice-text-muted)]">
                        {list.description}
                    </p>
                )}
                <p className="text-sm text-[color:var(--ice-text-muted)]">
                    {items.length}冊
                </p>
            </div>

            {items.length === 0 ? (
                <div className="flex flex-col items-start gap-3">
                    <p>このリストにはまだ本がありません。</p>
                    <p className="text-sm text-[color:var(--ice-text-muted)]">
                        本棚から本を開き、詳細画面の「リスト」欄でこのリストに
                        チェックを入れると追加できます。
                    </p>
                    <Link href="/books" className="ice-button">
                        本棚を開く
                    </Link>
                </div>
            ) : (
                <div className="flex flex-wrap gap-5">
                    {items.map((item, index) => (
                        <BookCard
                            key={item.userBookId}
                            href={`/books/${item.userBook.id}`}
                            title={item.userBook.book.title}
                            author={item.userBook.book.author}
                            publishedDate={item.userBook.book.published_date}
                            thumbnailUrl={item.userBook.book.thumbnail_url}
                            status={item.userBook.status as BookStatus}
                            index={index}
                        />
                    ))}
                </div>
            )}

            {/* --- リストの削除 ---------------------------------------------- */}
            {/* 消えるのはリストと「どの本が入っているか」の紐付けだけで、
                本棚の本そのものは残る。 */}
            <form action={deleteList.bind(null, list.id)} className="mt-4">
                <button type="submit" className="ice-button ice-button--danger">
                    このリストを削除
                </button>
            </form>
        </div>
    );
}
