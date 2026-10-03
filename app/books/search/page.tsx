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
import Image from "next/image";
import Link from "next/link";
// CSSProperties: styleプロパティに独自CSS変数(--ice-shine-delay)を
// 渡すための型（app/page.tsxと同じ理由）。
import type { CSSProperties } from "react";

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
                    <div
                        className="ice-card w-full sm:w-[270px]"
                        key={book.externalId}
                        // カードごとに光るタイミングをずらす(0s, 0.5s, 1s, ... を6枚ごとに繰り返す)
                        style={{ "--ice-shine-delay": `${(index % 6) * 0.5}s` } as CSSProperties}
                    >
                        <div className="ice-cover">
                            {book.thumbnailUrl ? (
                                <Image
                                    src={book.thumbnailUrl}
                                    alt={book.title}
                                    fill
                                    sizes="(max-width: 640px) 100vw, 270px"
                                    style={{ objectFit: "cover" }}
                                />
                            ) : (
                                <span className="text-4xl font-bold opacity-50">
                                    {book.title.slice(0, 1)}
                                </span>
                            )}
                        </div>
                        <p className="ice-card-title">{book.title}</p>
                        <p className="ice-card-author">{book.author}</p>
                        <p className="ice-card-meta">{book.publishedDate}</p>
                        <Link href={`/books/add?${new URLSearchParams({
                            externalSource: book.externalSource,
                            externalId: book.externalId,
                            title: book.title,
                            author: book.author ?? "",
                            publisher: book.publisher ?? "",
                            publishedDate: book.publishedDate ?? "",
                            thumbnailUrl: book.thumbnailUrl ?? "",
                            isbn: book.isbn ?? "",
                        }).toString()}`} className="ice-button mt-auto">
                            本棚に追加
                        </Link>
                    </div>

                )) }
            </div>
        </div>
    );
}
