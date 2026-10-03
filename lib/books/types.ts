// ============================================================================
// 書籍検索の結果を表す共通の型
// ----------------------------------------------------------------------------
// 楽天ブックスAPIとGoogle Books APIは、それぞれ全く違う形のレスポンスを返す。
// このままだと検索結果画面側で「楽天の時はこの書き方、Googleの時は別の書き方」と
// 分岐しないといけなくなり面倒なので、取得した直後にこの共通の形に変換（正規化）
// しておく。db/schema.ts の books テーブルのカラムとほぼ対応している。
// ============================================================================

export type BookSearchResult = {
    externalSource: "rakuten" | "google";
    externalId: string; // 取得元API内でのこの本のID（楽天はISBN、GoogleはvolumeIdを使う）
    isbn: string | null;
    title: string;
    author: string | null;
    publisher: string | null;
    publishedDate: string | null; // "YYYY-MM-DD" 形式の文字列 or null
    thumbnailUrl: string | null;
};
