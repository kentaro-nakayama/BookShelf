// ============================================================================
// 楽天ブックスAPIを呼び出す関数
// ----------------------------------------------------------------------------
// ここはDrizzleスキーマのように「自分で設計する」部分ではなく、楽天API側の
// 仕様・制約にそのまま従う必要がある「外部の決まりに合わせて書く」部分なので、
// あらかじめ書いておく。動作の仕組みはコメントで解説する。
// ============================================================================

import type { BookSearchResult } from "./types";
import { fetchJsonWithReferer, SITE_REFERER } from "./fetch-with-referer";

// 2026年の楽天API基盤移行により判明した重要な制約:
// サーバーから直接このAPIを呼ぶ場合でも、ブラウザが本来自動で付けるはずの
// Referer/Origin ヘッダーを「許可されたWebサイト」に登録した値と一致する形で
// 自分で明示的に付けないと、403エラー(REQUEST_CONTEXT_BODY_HTTP_REFERRER_MISSING)
// になる。これは実際にcurl的なリクエストを送って動作確認して判明した
// （詳しくは fetch-with-referer.ts のコメントを参照）。
const RAKUTEN_BOOKS_SEARCH_ENDPOINT =
    "https://openapi.rakuten.co.jp/services/api/BooksBook/Search/20170404";

// 楽天ブックスAPIのレスポンス(Item)の型。実際に返ってくるJSONのうち、
// 今回使うフィールドだけを定義している（他にも色々なフィールドがあるが省略）。
type RakutenBookItem = {
    title: string;
    author: string;
    isbn: string;
    publisherName: string;
    salesDate: string; // 例: "2015年01月15日" のような日本語混じりの文字列
    largeImageUrl: string;
};

type RakutenBooksApiResponse = {
    Items?: { Item: RakutenBookItem }[];
};

// salesDate("2015年01月15日"のような形式)を、DBのdate型に入れられる
// "YYYY-MM-DD"形式に変換する。変換できない場合はnullを返す。
function parseRakutenSalesDate(salesDate: string): string | null {
    const match = salesDate.match(/(\d{4})年(\d{1,2})月(\d{1,2})?日?/);
    if (!match) return null;
    const [, year, month, day] = match;
    const mm = month.padStart(2, "0");
    const dd = (day ?? "01").padStart(2, "0");
    return `${year}-${mm}-${dd}`;
}

// 楽天ブックスAPIでタイトル検索を行い、結果を共通の形(BookSearchResult)に
// 変換して返す。ISBNが無い商品（雑誌の一部など）は本として扱いにくいので除外する。
export async function searchRakutenBooks(
    query: string,
): Promise<BookSearchResult[]> {
    const applicationId = process.env.RAKUTEN_APPLICATION_ID;
    const accessKey = process.env.RAKUTEN_ACCESS_KEY;
    if (!applicationId || !accessKey) {
        throw new Error(
            "RAKUTEN_APPLICATION_ID または RAKUTEN_ACCESS_KEY が設定されていません",
        );
    }

    const url = new URL(RAKUTEN_BOOKS_SEARCH_ENDPOINT);
    url.searchParams.set("format", "json");
    url.searchParams.set("title", query);
    url.searchParams.set("applicationId", applicationId);
    url.searchParams.set("accessKey", accessKey);
    url.searchParams.set("hits", "20"); // 1回の検索で取得する最大件数

    const { status, data: rawData } = await fetchJsonWithReferer(url, SITE_REFERER);

    if (status < 200 || status >= 300) {
        throw new Error(`楽天ブックスAPIの呼び出しに失敗しました (status: ${status})`);
    }

    const data = rawData as RakutenBooksApiResponse;

    return (data.Items ?? [])
        .map(({ Item }) => Item)
        .filter((item) => item.isbn) // ISBNが無いものは除外
        .map((item): BookSearchResult => ({
            externalSource: "rakuten",
            externalId: item.isbn, // 楽天はISBNをそのまま外部IDとして使う
            isbn: item.isbn,
            title: item.title,
            author: item.author || null,
            publisher: item.publisherName || null,
            publishedDate: parseRakutenSalesDate(item.salesDate),
            thumbnailUrl: item.largeImageUrl || null,
        }));
}
