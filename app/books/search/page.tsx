// ============================================================================
// 書籍検索画面（自分で書く）
// ----------------------------------------------------------------------------
// URL: /books/search （このファイルのパス app/books/search/page.tsx がそのまま
// URLになる、以前説明したファイルベースルーティング）
//
// 設計方針:
//   検索キーワードをURLのクエリパラメータ(?q=キーワード)として持たせる。
//   こうすると、検索フォームの送信先を自分自身のURLにするだけで実現でき、
//   クライアント側のJavaScriptやServer Actionが不要になる（フォームの
//   標準機能だけで動く、一番シンプルな方法）。
//   また検索結果URLをブックマーク・共有できる、という副次的な利点もある。
// ============================================================================

// ----------------------------------------------------------------------------
// 最初に必要なimport
// ----------------------------------------------------------------------------
// searchBooks: lib/books/search.ts の、楽天→Googleフォールバック検索関数
import { searchBooks } from "@/lib/books/search";
// BookCard: 本1冊分のカード表示部品。ホーム・本棚一覧と同じものを使い、
// 画面ごとに見た目がばらつかないようにしている。
import BookCard from "@/components/book-card";

export default async function SearchPage({searchParams}: PageProps<"/books/search">) {
    const params = await searchParams;
    const query = typeof params.q === "string" ? params.q : "";

    // searchBooks()は楽天・Google Booksの両方のAPI呼び出しに失敗すると
    // 例外を投げる(lib/books/search.tsを参照)。ここでtry/catchしておかないと、
    // 外部APIの不調がそのままページ全体のクラッシュ(サーバーエラー画面)に
    // つながってしまうため、失敗はエラーメッセージとして画面に出すだけに留める。
    let searchResult: Awaited<ReturnType<typeof searchBooks>> = [];
    let searchFailed = false;
    if (query) {
        try {
            searchResult = await searchBooks(query);
        } catch (error) {
            console.error("書籍検索に失敗しました:", error);
            searchFailed = true;
        }
    }

    return (
        <div className="mx-auto max-w-5xl px-6 py-10 flex flex-col gap-8 sm:px-12">
            <h2 className="text-2xl font-bold">書籍検索</h2>
            <form action="" method="GET" className="flex flex-col gap-3 sm:flex-row">
                <input
                    type="text"
                    name="q"
                    defaultValue={query}
                    placeholder="タイトルで検索"
                    className="ice-input flex-1"
                />
                <button type="submit" className="ice-button sm:w-auto">検索</button>
            </form>
            <div className="flex flex-wrap gap-5">
                { searchFailed && (
                    <p>検索中にエラーが発生しました。しばらくしてからもう一度お試しください。</p>
                )}
                { !searchFailed && query && searchResult.length === 0 && <p>見つかりませんでした</p>}
                { searchResult.map((book, index) => (
                    // ホーム・本棚一覧と同じ<BookCard>を使う。
                    // 違いは2点だけで、どちらもプロパティで指定している。
                    //   href        … 詳細ページではなく登録確認ページ(/books/add)へ
                    //   actionLabel … 未登録なので読書ステータスの代わりに操作ラベルを出す
                    <BookCard
                        key={book.externalId}
                        href={`/books/add?${new URLSearchParams({
                            externalSource: book.externalSource,
                            externalId: book.externalId,
                            title: book.title,
                            author: book.author ?? "",
                            publisher: book.publisher ?? "",
                            publishedDate: book.publishedDate ?? "",
                            thumbnailUrl: book.thumbnailUrl ?? "",
                            isbn: book.isbn ?? "",
                        }).toString()}`}
                        title={book.title}
                        author={book.author}
                        publishedDate={book.publishedDate}
                        thumbnailUrl={book.thumbnailUrl}
                        actionLabel="＋ 本棚に追加"
                        index={index}
                    />
                )) }
            </div>
        </div>
    );
}
