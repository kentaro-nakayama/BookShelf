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

// ----------------------------------------------------------------------------
// TODO 1: ページ本体を作る
// ----------------------------------------------------------------------------
// このページはURLのクエリパラメータを受け取る必要があるので、propsとして
// `searchParams` を受け取る形にする。このNext.jsバージョンでは
// `searchParams` は Promise型 なので、使う前に await する必要がある
// （.next/dev/types/routes.d.ts で実際に確認済み）。
//
// export default async function SearchPage({
//     searchParams,
// }: PageProps<"/books/search">) {
//     const params = await searchParams;
//     const query = typeof params.q === "string" ? params.q : "";
//
//     // クエリが空なら検索を実行しない（初回アクセス時など）
//     const results = query ? await searchBooks(query) : [];
//
//     return ( ... );
// }

// ----------------------------------------------------------------------------
// TODO 2: 検索フォームを作る
// ----------------------------------------------------------------------------
// ポイント: <form>のactionに関数を渡す「Server Action」方式ではなく、
// 今回は素朴なHTMLフォームの機能だけを使う。method="GET"のフォームは、
// 送信すると「今のURL + ?入力した内容」に自動で遷移する（JS不要）。
//
// <form>
//     <input type="text" name="q" defaultValue={query} placeholder="タイトルで検索" />
//     <Button type="submit">検索</Button>
// </form>
//
// name="q" が重要: この名前が、さっきの searchParams.q に対応するキーになる。
// defaultValue={query}: 検索後も入力欄に今のキーワードが残るようにする
// （valueではなくdefaultValueを使う理由: これはサーバー側で1回だけ描画される
// 値で、ユーザーがその後入力欄を自由に編集できる。valueだと編集できなくなる）

// ----------------------------------------------------------------------------
// TODO 3: 検索結果を一覧表示する
// ----------------------------------------------------------------------------
// query があるのに results.length === 0 なら「見つかりませんでした」
// results があれば .map() で1冊ずつ表示（表紙画像・タイトル・著者など）
//
// 表紙画像の表示には next/image の Image コンポーネントを使う
// （以前Googleのプロフィール画像で使ったのと同じ）。ただし今回は
// 楽天・Google Books、両方の画像ドメインを next.config.ts の
// remotePatterns に許可する必要がある点に注意（まだ追加していないかも
// しれないので、エラーが出たら next.config.ts を確認すること）。
//
// 「本棚に追加」ボタンは、今回はまだ実装しない（次のステップで対応する）。
// 今回はまず検索結果が正しく表示されるところまでを目標にする。
//
// ここに書いてみる ↓

import { Button } from "@/components/ui/button";
import Image from "next/image";
import { addBookToShelf } from "./actions";

export default async function SearchPage({searchParams}: PageProps<"/books/search">) {
    const params = await searchParams;
    const query = typeof params.q === "string" ? params.q : "";
    const searchResult = query ? await searchBooks(query) : [];

    return (
        <div>
            <h2>書籍検索</h2>
            <div className="search-area">
                <form action="" method="GET">
                    <input type="text" name="q" defaultValue={query} placeholder="タイトルで検索"/>
                    <Button type="submit">検索</Button>
                </form>
            </div>
            <div className="results-area">
                { query && searchResult.length === 0 && <p>見つかりませんでした</p>}
                { searchResult.map((book) => (
                    <div className="book-card" key={book.externalId}>
                        <p>{book.title}</p>
                        <p>{book.author}</p>
                        <div className="book-image">
                            {book.thumbnailUrl && <Image src={book.thumbnailUrl} alt={book.title} width={128} height={192} />}
                        </div>
                        <p>{book.publishedDate}</p>
                        <form action={addBookToShelf.bind(null, book)} method="post">
                            <Button type="submit">本棚に追加</Button>
                        </form>
                    </div>

                )) }
            </div>
        </div>
    );
}
