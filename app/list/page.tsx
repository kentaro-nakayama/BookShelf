// ============================================================================
// マイリスト画面 = 自分で作ったリストの一覧（自分で書く）
// ----------------------------------------------------------------------------
// URL: /list
//
// 「本棚」がすべての蔵書を1つの場所で管理するのに対し、こちらはユーザーが
// 自由にテーマを決めて本をまとめられる機能（例:「2026年に読んだ本」
// 「後輩におすすめしたい技術書」）。
//
// 1冊の本は複数のリストに入れられるし、どのリストにも入れなくてもよい。
// リストを消しても本棚の本は消えない（DB側のcascadeは中間テーブルにしか効かない）。
// ============================================================================

import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/db";
import { bookLists, bookListItems } from "@/db/schema";
// count: SQLのCOUNT()。リストごとの冊数を数えるのに使う
import { eq, desc, count } from "drizzle-orm";
import { createList } from "./actions";

// エラーの種類ごとの表示文。Server Action(actions.ts)が
// /list?error=... の形で渡してくる。
const ERROR_MESSAGE: Record<string, string> = {
    empty: "リスト名を入力してください。",
    duplicate: "同じ名前のリストがすでにあります。別の名前を付けてください。",
    too_long: "リスト名は50文字、説明は200文字までです。",
};

export default async function ListPage({ searchParams }: PageProps<"/list">) {
    const session = await auth();
    if (!session?.user?.id) {
        return (
            <div className="mx-auto max-w-2xl px-6 py-16 flex flex-col items-center gap-4 text-center sm:px-12">
                <p>マイリストを使うにはログインが必要です</p>
                <Link href="/" className="ice-button">
                    ホームへ
                </Link>
            </div>
        );
    }

    const params = await searchParams;
    const errorKey = typeof params.error === "string" ? params.error : "";
    const errorMessage = ERROR_MESSAGE[errorKey];

    // --- リスト一覧を冊数付きで取得 -----------------------------------------
    // leftJoin を使っているのがポイント。
    // 普通のjoin(innerJoin)だと「本が1冊も入っていないリスト」が
    // 結果から消えてしまう。leftJoinなら中身が無くても必ず1行残り、
    // count()は相手がNULLのとき0を返すので「0冊」と表示できる。
    const lists = await db
        .select({
            id: bookLists.id,
            name: bookLists.name,
            description: bookLists.description,
            createdAt: bookLists.createdAt,
            bookCount: count(bookListItems.bookListId),
        })
        .from(bookLists)
        .leftJoin(bookListItems, eq(bookListItems.bookListId, bookLists.id))
        .where(eq(bookLists.userId, session.user.id))
        // groupBy: 「リストごとにまとめて数える」ための指定。
        // これが無いと全リストの合計が1行だけ返ってしまう。
        .groupBy(bookLists.id)
        .orderBy(desc(bookLists.createdAt));

    return (
        <div className="mx-auto max-w-2xl px-6 py-10 flex flex-col gap-7 sm:px-12">
            <h2 className="text-2xl font-bold">マイリスト</h2>

            {/* --- 新規作成フォーム ------------------------------------------ */}
            <form action={createList} className="ice-card gap-4">
                <p className="font-bold">新しいリストを作る</p>

                {errorMessage && (
                    // role="alert": 支援技術に「今すぐ伝えるべき情報」と知らせる属性
                    <p className="ice-form-error" role="alert">
                        {errorMessage}
                    </p>
                )}

                <label className="ice-field">
                    <span className="ice-field-label">リスト名</span>
                    <input
                        type="text"
                        name="name"
                        required
                        maxLength={50}
                        placeholder="例: 2026年に読んだ本"
                        className="ice-input"
                    />
                </label>

                <label className="ice-field">
                    <span className="ice-field-label">説明（任意）</span>
                    <input
                        type="text"
                        name="description"
                        maxLength={200}
                        placeholder="どんなリストか短く書いておける"
                        className="ice-input"
                    />
                </label>

                <button type="submit" className="ice-button self-start">
                    作成する
                </button>
            </form>

            {/* --- リスト一覧 ------------------------------------------------ */}
            {lists.length === 0 ? (
                <p className="text-sm text-[color:var(--ice-text-muted)]">
                    まだリストがありません。上のフォームから作ってみましょう。
                    作ったリストには、本の詳細画面から本を追加できます。
                </p>
            ) : (
                <div className="flex flex-col gap-3">
                    {lists.map((list) => (
                        // カード全体がリストの中身へのリンク（本棚カードと同じ考え方）
                        <Link
                            key={list.id}
                            href={`/list/${list.id}`}
                            className="ice-card ice-list-card"
                        >
                            <div className="flex items-baseline justify-between gap-3">
                                <p className="ice-card-title">{list.name}</p>
                                <span className="ice-list-count">{list.bookCount}冊</span>
                            </div>
                            {list.description && (
                                <p className="ice-card-author">{list.description}</p>
                            )}
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
