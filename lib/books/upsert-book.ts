// ============================================================================
// books テーブルへの「あれば使う、無ければ作る」処理
// ----------------------------------------------------------------------------
// 本棚への追加・編集、どちらからも使う共通処理なのでここに切り出している。
// ============================================================================

import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { books } from "@/db/schema";
import type { BookSearchResult } from "./types";

// 指定した本が books テーブルに既にキャッシュされていればそのidを、
// 無ければ新規に挿入してから発行されたidを返す。
export async function upsertBook(book: BookSearchResult): Promise<string> {
    const existingBook = await db.query.books.findFirst({
        where: and(
            eq(books.external_source, book.externalSource),
            eq(books.external_id, book.externalId),
        ),
    });

    if (existingBook) {
        return existingBook.id;
    }

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

    return inserted.id;
}
