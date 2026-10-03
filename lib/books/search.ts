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
    // 楽天ブックスAPIがエラー(レート制限・一時的な障害など)を返した場合、
    // ここで例外を外に投げてしまうと検索ページ全体がクラッシュしてしまう。
    // 「0件だった」場合と同じ扱いにして、Google Booksへのフォールバックに
    // つなげることで、片方のAPIの不調が検索機能全体を止めないようにする。
    let rakutenResults: BookSearchResult[] = [];
    try {
        rakutenResults = await searchRakutenBooks(query);
    } catch (error) {
        console.error("楽天ブックスAPIの呼び出しに失敗しました:", error);
    }

    if (rakutenResults.length > 0) {
        return rakutenResults;
    }

    // 楽天で1件もヒットしなかった場合(エラーだった場合を含む)だけ、
    // Google Booksで検索する。こちらが失敗した場合は、呼び出し元
    // (app/books/search/page.tsx)でまとめてエラーハンドリングする。
    return searchGoogleBooks(query);
}
