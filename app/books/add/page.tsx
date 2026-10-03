// ============================================================================
// 本棚に追加（詳細設定）画面（自分で書く）
// ----------------------------------------------------------------------------
// URL: /books/add?externalSource=...&externalId=...&title=...
// （search/page.tsx のリンクから、本の情報をクエリパラメータとして渡されて来る）
//
// やること:
//   1. URLのクエリパラメータから、本の情報(BookSearchResult相当)を復元する
//   2. ジャンル一覧をDBから取得する
//   3. ステータス・星評価・感想文・ジャンルを選べるフォームを表示する
//   4. フォーム送信時に app/books/add/actions.ts の confirmAddBook を呼ぶ
// ============================================================================

// ----------------------------------------------------------------------------
// 最初に必要なimport
// ----------------------------------------------------------------------------
// db, genres:      ジャンル一覧をDBから取得するため
import { db } from "@/db";
import { genres } from "@/db/schema";
//
// confirmAddBook:   このフォームが送信された時に呼ばれるServer Action
import { confirmAddBook } from "./actions";
//
// Button:           これまでも使ってきたUI部品
import { Button } from "@/components/ui/button";
//
// BookSearchResult: 復元する本のデータの型（lib/books/types.ts）
import type { BookSearchResult } from "@/lib/books/types";

// ----------------------------------------------------------------------------
// クエリパラメータから本の情報を復元する
// ----------------------------------------------------------------------------
// search/page.tsx で URLSearchParams を使って渡した値を受け取る。
// クエリパラメータは全て文字列(string)またはundefinedとして渡ってくるので、
// BookSearchResult型（externalSourceは"rakuten"|"google"のユニオン型、
// 他の項目はstring|null）に合わせて1つずつ変換する必要がある。
//
export default async function AddBookPage({
    searchParams,
}: PageProps<"/books/add">) {
    const params = await searchParams;

    // クエリパラメータから復元した，本棚に追加したい本の情報
    const book: BookSearchResult = {
        externalSource: params.externalSource === "google" ? "google" : "rakuten",
        externalId: typeof params.externalId === "string" ? params.externalId : "",
        title: typeof params.title === "string" ? params.title : "",
        author:
            typeof params.author === "string" && params.author !== ""
                ? params.author
                : null,
        publisher:
            typeof params.publisher === "string" && params.publisher !== ""
                ? params.publisher
                : null,
        publishedDate:
            typeof params.publishedDate === "string" && params.publishedDate !== ""
                ? params.publishedDate
                : null,
        thumbnailUrl:
            typeof params.thumbnailUrl === "string" && params.thumbnailUrl !== ""
                ? params.thumbnailUrl
                : null,
        isbn: typeof params.isbn === "string" && params.isbn !== "" ? params.isbn : null,
    };
    
    // ジャンル一覧を取得
    const allGenres = await db.select().from(genres);

    return (
        <div>
            <form action={confirmAddBook.bind(null, book)}>
                <p>{book.title}</p>
                <div className="set-status-area">
                    <select name="status" defaultValue="want_to_read">
                        <option value="want_to_read">読みたい</option>
                        <option value="reading">読書中</option>
                        <option value="finished">読了</option>
                    </select>
                </div>
                <div className="set-rating-area">
                    <select name="rating" defaultValue="">
                        <option value="">評価なし</option>
                        <option value="1">★1</option>
                        <option value="2">★2</option>
                        <option value="3">★3</option>
                        <option value="4">★4</option>
                        <option value="5">★5</option>
                    </select>
                </div>
                <div className="set-review-area">
                    <textarea name="review" placeholder="感想を書く（任意）" />
                </div>
                <div className="set-genres-area">
                    {allGenres.map((genre) => (
                        <label key={genre.id}>
                            <input type="checkbox" name="genreIds" value={genre.id} />
                            {genre.name}
                        </label>
                    ))}
                </div>
                <Button type="submit">追加</Button>
            </form>
        </div>
    )
}
