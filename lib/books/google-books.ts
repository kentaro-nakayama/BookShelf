// ============================================================================
// Google Books APIを呼び出す関数
// ----------------------------------------------------------------------------
// rakuten.ts と同じく「外部APIの決まりに合わせて書く」部分。
// 当初キーなしで試したが、この開発環境では429(レート制限)になったため、
// Google Cloud ConsoleでAPIキーを取得して使っている。キーには「ウェブサイト制限」
// を付けたため、楽天と同様にサーバーからの呼び出しでもRefererヘッダーを
// 手動で付ける必要がある（fetch-with-referer.ts を参照）。
// ============================================================================

import type { BookSearchResult } from "./types";
import { fetchJsonWithReferer, SITE_REFERER } from "./fetch-with-referer";

const GOOGLE_BOOKS_SEARCH_ENDPOINT = "https://www.googleapis.com/books/v1/volumes";

// Google Books APIのレスポンス(item)の型。今回使うフィールドのみ定義。
type GoogleBookVolume = {
    id: string;
    volumeInfo: {
        title?: string;
        authors?: string[];
        publisher?: string;
        publishedDate?: string; // "YYYY-MM-DD" / "YYYY-MM" / "YYYY" のいずれかで返ってくる
        imageLinks?: {
            thumbnail?: string;
        };
        industryIdentifiers?: {
            type: string; // "ISBN_13" | "ISBN_10" | "OTHER" など
            identifier: string;
        }[];
    };
};

type GoogleBooksApiResponse = {
    items?: GoogleBookVolume[];
};

// Googleの industryIdentifiers 配列からISBN-13（なければISBN-10）を探す。
// どちらも無ければnullを返す。
function extractIsbn(
    identifiers: GoogleBookVolume["volumeInfo"]["industryIdentifiers"],
): string | null {
    if (!identifiers) return null;
    const isbn13 = identifiers.find((i) => i.type === "ISBN_13");
    if (isbn13) return isbn13.identifier;
    const isbn10 = identifiers.find((i) => i.type === "ISBN_10");
    return isbn10 ? isbn10.identifier : null;
}

// Googleのpublisheddateは "2015"（年だけ）や "2015-03"（年月だけ）のように
// 情報が欠けていることが多い。DBのdate型に入れられる"YYYY-MM-DD"に揃える。
function normalizeGoogleDate(publishedDate: string | undefined): string | null {
    if (!publishedDate) return null;
    const parts = publishedDate.split("-");
    const year = parts[0];
    const month = parts[1] ?? "01";
    const day = parts[2] ?? "01";
    return `${year}-${month}-${day}`;
}

// Googleのサムネイル画像URLは http:// で返ってくることが多い。
// httpsのページに http:// の画像を埋め込むと「混在コンテンツ」として
// ブラウザに警告・ブロックされることがあるため、https:// に揃えておく。
function normalizeThumbnailUrl(url: string | undefined): string | null {
    if (!url) return null;
    return url.replace(/^http:\/\//, "https://");
}

export async function searchGoogleBooks(
    query: string,
): Promise<BookSearchResult[]> {
    const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
    if (!apiKey) {
        throw new Error("GOOGLE_BOOKS_API_KEY が設定されていません");
    }

    const url = new URL(GOOGLE_BOOKS_SEARCH_ENDPOINT);
    // 本来は intitle:${query} でタイトル限定検索にしたかったが、現在の
    // Google Books APIではこの演算子が機能せず0件になることを確認したため、
    // 通常のキーワード検索にしている（フォールバック用途なので許容する）。
    url.searchParams.set("q", query);
    url.searchParams.set("maxResults", "20");
    url.searchParams.set("key", apiKey);

    const { status, data: rawData } = await fetchJsonWithReferer(url, SITE_REFERER);

    if (status < 200 || status >= 300) {
        throw new Error(`Google Books APIの呼び出しに失敗しました (status: ${status})`);
    }

    const data = rawData as GoogleBooksApiResponse;

    return (data.items ?? []).map((item): BookSearchResult => {
        const { volumeInfo } = item;
        return {
            externalSource: "google",
            externalId: item.id, // GoogleはvolumeId(例: "abc123XYZ")を外部IDとして使う
            isbn: extractIsbn(volumeInfo.industryIdentifiers),
            title: volumeInfo.title ?? "(タイトル不明)",
            author: volumeInfo.authors ? volumeInfo.authors.join("/") : null,
            publisher: volumeInfo.publisher ?? null,
            publishedDate: normalizeGoogleDate(volumeInfo.publishedDate),
            thumbnailUrl: normalizeThumbnailUrl(volumeInfo.imageLinks?.thumbnail),
        };
    });
}
