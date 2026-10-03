// ============================================================================
// 書籍検索の優先度フォールバックロジック
// ----------------------------------------------------------------------------
// docs/requirements.md で決めた仕様をそのままコードにしたもの:
//   楽天ブックスAPIで検索 → 0件ならGoogle Books APIで再検索
// ============================================================================

import { searchRakutenBooks } from "./rakuten";
import { searchGoogleBooks } from "./google-books";
import type { BookSearchResult } from "./types";

export async function searchBooks(query: string): Promise<BookSearchResult[]> {
    const rakutenResults = await searchRakutenBooks(query);

    if (rakutenResults.length > 0) {
        return rakutenResults;
    }

    // 楽天で1件もヒットしなかった場合だけ、Google Booksで検索する
    return searchGoogleBooks(query);
}
