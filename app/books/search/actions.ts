// ============================================================================
// 「本棚に追加」ボタンの処理（Server Action）
// ----------------------------------------------------------------------------
// ファイルの先頭に "use server" と書くと、このファイル内のexportされた関数は
// 全てServer Actionになる（1つの関数の中に "use server" を書く代わりに、
// ファイル単位でまとめて指定する書き方）。
//
// 呼び出し方（page.tsx側）: 検索結果の本ごとに異なるデータを渡したいので、
//   <form action={addBookToShelf.bind(null, book)}>
// のように .bind(null, book) を使う。これは「addBookToShelfの第1引数(book)を
// あらかじめ固定した、新しい関数」を作る書き方。フォームが送信されると、
// Next.jsが残りの引数(formData)を自動で渡してくれるので、結果的に
// addBookToShelf(book, formData) が呼ばれる形になる。
// ============================================================================

"use server";

import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { books, userBooks } from "@/db/schema";
import type { BookSearchResult } from "@/lib/books/types";

export async function addBookToShelf(book: BookSearchResult, _formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("ログインが必要です");
    }

    // 1. この本が books テーブルに既にキャッシュされていないか確認する
    //    （同じ本を別のユーザーが既に登録していた場合、books行は使い回す）
    const existingBook = await db.query.books.findFirst({
        where: and(
            eq(books.external_source, book.externalSource),
            eq(books.external_id, book.externalId),
        ),
    });

    let bookId: string;

    if (existingBook) {
        bookId = existingBook.id;
    } else {
        // まだキャッシュされていなければ新規に books へ挿入し、
        // 発行されたidを受け取る（.returning() で挿入した行が返ってくる）
        const [inserted] = await db
            .insert(books)
            .values({
                external_source: book.externalSource,
                external_id: book.externalId,
                isbn: book.isbn,
                title: book.title,
                author: book.author,
                publisher: book.publisher,
                published_date: book.publishedDate,
                thumbnail_url: book.thumbnailUrl,
            })
            .returning();
        bookId = inserted.id;
    }

    // 2. user_books に登録する。既に同じユーザー×同じ本の組み合わせが
    //    あった場合（UNIQUE制約違反）は、エラーにせず何もしない
    //    （.onConflictDoNothing()、db/seed.tsで使ったのと同じ考え方）
    await db
        .insert(userBooks)
        .values({
            userId: session.user.id,
            bookId,
            status: "want_to_read",
        })
        .onConflictDoNothing();

    // 3. 登録が終わったら本棚一覧（トップページ）に戻る
    redirect("/");
}
