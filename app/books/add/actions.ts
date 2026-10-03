// ============================================================================
// 「本棚に追加（詳細設定あり）」画面のServer Action
// ----------------------------------------------------------------------------
// 呼び出し方は search/actions.ts の addBookToShelf と同じパターン:
//   <form action={confirmAddBook.bind(null, book)}>
// book(検索結果の情報)は事前に固定し、フォームの入力内容(status/rating/
// review/genreIds)だけを formData から受け取る。
// ============================================================================

"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { userBooks, userBookGenres } from "@/db/schema";
import { upsertBook } from "@/lib/books/upsert-book";
import type { BookSearchResult } from "@/lib/books/types";

// db/schema.ts の enum_status で定義した3つの値と同じもの。
// フォームから来る値(文字列)がこのどれかであることを、使う前に確認する。
const VALID_STATUSES = ["want_to_read", "reading", "finished"] as const;
type Status = (typeof VALID_STATUSES)[number];

function parseStatus(value: FormDataEntryValue | null): Status {
    if (typeof value === "string" && (VALID_STATUSES as readonly string[]).includes(value)) {
        return value as Status;
    }
    // 不正な値が来た場合のフォールバック（通常は起こらない想定）
    return "want_to_read";
}

export async function confirmAddBook(book: BookSearchResult, formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("ログインが必要です");
    }

    const status = parseStatus(formData.get("status"));

    // 星評価: 未選択(空文字)ならnull、選択されていれば数値に変換
    const ratingRaw = formData.get("rating");
    const rating =
        typeof ratingRaw === "string" && ratingRaw !== "" ? Number(ratingRaw) : null;

    // 感想文: 空文字ならnullにする（何も書いていないことと、空文字を
    // 意図的に入力したことを、DB上は同じ「null」として扱ってよいため）
    const reviewRaw = formData.get("review");
    const reviewText =
        typeof reviewRaw === "string" && reviewRaw !== "" ? reviewRaw : null;

    // ジャンル: チェックボックスなので同じname="genreIds"が複数来る。
    // formData.getAll() で、そのnameの値を配列としてまとめて取得できる
    // （.get()だと最初の1つしか取れない）。
    const genreIds = formData.getAll("genreIds").map((id) => Number(id));

    const bookId = await upsertBook(book);

    const [userBook] = await db
        .insert(userBooks)
        .values({
            userId: session.user.id,
            bookId,
            status,
            rating,
            reviewText,
        })
        .onConflictDoNothing()
        .returning();

    // onConflictDoNothing() で何も挿入されなかった場合(既に登録済みの本を
    // もう一度追加しようとした場合)は userBook が undefined になる。
    // その場合はジャンルの紐付けもできない（紐付け先が無いため）ので、
    // そのままトップページに戻る。
    if (userBook && genreIds.length > 0) {
        await db.insert(userBookGenres).values(
            genreIds.map((genreId) => ({
                userBookId: userBook.id,
                genreId,
            })),
        );
    }

    redirect("/");
}
