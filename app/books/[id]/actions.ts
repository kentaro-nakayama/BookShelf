// ============================================================================
// 本の詳細・編集画面のServer Action
// ----------------------------------------------------------------------------
// app/books/add/actions.ts の confirmAddBook と似ているが、「新しい行を作る」
// のではなく「既存のuser_books行を更新する」点が違う。
// ============================================================================

"use server";

import { eq, and, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { userBooks, userBookGenres, bookLists, bookListItems } from "@/db/schema";

const VALID_STATUSES = ["want_to_read", "reading", "finished"] as const;
type Status = (typeof VALID_STATUSES)[number];

function parseStatus(value: FormDataEntryValue | null): Status {
    if (typeof value === "string" && (VALID_STATUSES as readonly string[]).includes(value)) {
        return value as Status;
    }
    return "want_to_read";
}

// 呼び出し方は <form action={updateBook.bind(null, userBookId)}> という形。
// confirmAddBookがbookオブジェクトを固定していたのと同じパターンで、
// 今回は「どのuser_books行を更新するか」を表すid(文字列)を固定する。
export async function updateBook(userBookId: string, formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("ログインが必要です");
    }

    // 認可チェック: 指定されたuser_books行が「本当に自分のものか」を確認する。
    // これが無いと、他人の本棚登録のidをURLに直接入力されただけで、
    // 他人のデータを書き換えられてしまう危険がある。
    const target = await db.query.userBooks.findFirst({
        where: and(
            eq(userBooks.id, userBookId),
            eq(userBooks.userId, session.user.id),
        ),
    });
    if (!target) {
        throw new Error("対象の本棚データが見つかりません");
    }

    const status = parseStatus(formData.get("status"));

    const ratingRaw = formData.get("rating");
    const rating =
        typeof ratingRaw === "string" && ratingRaw !== "" ? Number(ratingRaw) : null;

    const reviewRaw = formData.get("review");
    const reviewText =
        typeof reviewRaw === "string" && reviewRaw !== "" ? reviewRaw : null;

    const genreIds = formData.getAll("genreIds").map((id) => Number(id));

    // チェックされたリストのid。チェックが1つも無ければ空配列になる。
    const listIds = formData
        .getAll("listIds")
        .filter((value): value is string => typeof value === "string");

    await db
        .update(userBooks)
        .set({
            status,
            rating,
            reviewText,
            // updatedAtはINSERT時のデフォルト値(defaultNow)はあるが、UPDATE時に
            // 自動更新はされないため、ここで明示的に「今」をセットする。
            updatedAt: new Date(),
        })
        .where(eq(userBooks.id, userBookId));

    // ジャンルの更新は「一旦既存の紐付けを全部消してから、選ばれた分を
    // 入れ直す」という単純な方式にする（増えた分・減った分を個別に
    // 計算するより、間違いが起きにくいため）。
    await db
        .delete(userBookGenres)
        .where(eq(userBookGenres.userBookId, userBookId));

    if (genreIds.length > 0) {
        await db.insert(userBookGenres).values(
            genreIds.map((genreId) => ({ userBookId, genreId })),
        );
    }

    // --- マイリストへの所属を更新 -------------------------------------------
    // ジャンルと同じく「一旦全部消してから入れ直す」方式。
    await db
        .delete(bookListItems)
        .where(eq(bookListItems.userBookId, userBookId));

    if (listIds.length > 0) {
        // 認可チェック: 送られてきたリストidが本当に自分のリストかを確認する。
        // チェックボックスの値はブラウザの開発者ツールで書き換えられるため、
        // 受け取った値をそのまま信用して挿入すると、他人のリストに
        // 自分の本を紛れ込ませることができてしまう。
        // 「自分のリスト」に絞って引き直し、ヒットしたidだけを使う。
        const ownedLists = await db
            .select({ id: bookLists.id })
            .from(bookLists)
            .where(
                and(
                    eq(bookLists.userId, session.user.id),
                    inArray(bookLists.id, listIds),
                ),
            );

        if (ownedLists.length > 0) {
            await db.insert(bookListItems).values(
                ownedLists.map((list) => ({
                    bookListId: list.id,
                    userBookId,
                })),
            );
        }
    }

    redirect("/");
}

// 本棚から削除する。呼び出し方は <form action={removeFromShelf.bind(null, userBookId)}>。
//
// user_books行を削除するだけでよい。紐づく user_book_genres は
// db/schema.ts で `onDelete: "cascade"` を指定済みなので、user_books側を
// 消せばDBが自動的に一緒に削除してくれる（手動でdeleteする必要はない）。
export async function removeFromShelf(userBookId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("ログインが必要です");
    }

    // 更新時と同じ理由で、削除も「自分の本棚登録か」を条件に含める
    // （whereの条件に含めることで、他人のデータは0件ヒットになり
    // 削除されない、という形で認可チェックを兼ねている）。
    await db
        .delete(userBooks)
        .where(
            and(eq(userBooks.id, userBookId), eq(userBooks.userId, session.user.id)),
        );

    redirect("/");
}
