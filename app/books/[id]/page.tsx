// ============================================================================
// 本の詳細・編集画面（自分で書く）
// ----------------------------------------------------------------------------
// URL: /books/[id] の [id] は user_books.id （本そのものではなく、
// 「このユーザーがこの本をどう登録しているか」を表す行のid）
//
// やること:
//   1. URLの動的ルート部分(id)を受け取る
//   2. そのidのuser_books行を、book情報と一緒に取得する
//      （自分の本棚登録でなければ見せない、という認可チェックも行う）
//   3. 今設定されているジャンルのid一覧を取得する
//   4. 全ジャンル一覧を取得する
//   5. BookShelfForm（追加画面と共通のフォーム部品）に、取得した値を
//      初期値として渡して表示する
// ============================================================================

// ----------------------------------------------------------------------------
// 最初に必要なimport
// ----------------------------------------------------------------------------
// auth:             ログイン状態の確認
import { auth } from "@/auth";
//
// db, userBooks, userBookGenres, genres: DBアクセス用
import { db } from "@/db";
import { userBooks, userBookGenres, genres } from "@/db/schema";
//
// eq, and:          絞り込み条件を書くためのヘルパー
import { eq, and } from "drizzle-orm";
//
// updateBook:       このフォームの送信先Server Action
import { updateBook } from "./actions";
//
// BookShelfForm:    追加画面と共通のフォーム部品
import { BookShelfForm } from "@/components/book-shelf-form";

// ----------------------------------------------------------------------------
// TODO 1: ルートパラメータ(id)とログイン状態を取得する
// ----------------------------------------------------------------------------
// [id] という動的ルートなので、searchParamsの代わりに params を受け取る。
// これもPromise型なのでawaitが必要（searchParamsと同じ考え方）。
//
// export default async function BookDetailPage({
//     params,
// }: PageProps<"/books/[id]">) {
//     const { id } = await params;
//     const session = await auth();
//
//     if (!session?.user?.id) {
//         return <p>ログインしてください</p>;
//     }
//
//     // ここにTODO2以降が続く
// }

// ----------------------------------------------------------------------------
// TODO 2: 対象のuser_books行を取得する（認可チェック込み）
// ----------------------------------------------------------------------------
// actions.ts の updateBook と同じ考え方: 指定されたidの行が
// 「本当に今ログイン中のユーザーのものか」を同時にチェックする。
// こうすることで、他人のuser_books.idをURLに直接打ち込まれても
// 中身が見えないようにする。
//
// const userBook = await db.query.userBooks.findFirst({
//     where: and(eq(userBooks.id, id), eq(userBooks.userId, session.user.id)),
//     with: { book: true }, // db/schema.tsのuserBooksRelationsで定義済みの関連
// });
//
// if (!userBook) {
//     return <p>見つかりませんでした</p>;
// }

// ----------------------------------------------------------------------------
// TODO 3: 今設定されているジャンルのid一覧を取得する
// ----------------------------------------------------------------------------
// user_book_genres を直接検索する（userBooksRelationsにはまだ
// genresとの関連を定義していないため、db.query...ではなく
// 普通のselectで取得する）。
//
// const currentGenreLinks = await db
//     .select({ genreId: userBookGenres.genreId })
//     .from(userBookGenres)
//     .where(eq(userBookGenres.userBookId, id));
// const currentGenreIds = currentGenreLinks.map((link) => link.genreId);

// ----------------------------------------------------------------------------
// TODO 4: 全ジャンル一覧を取得する
// ----------------------------------------------------------------------------
// const allGenres = await db.select().from(genres);
// （add/page.tsxで既に書いたのと同じ）

// ----------------------------------------------------------------------------
// TODO 5: BookShelfFormを表示する
// ----------------------------------------------------------------------------
// <BookShelfForm
//     bookTitle={userBook.book.title}
//     allGenres={allGenres}
//     initialStatus={userBook.status}
//     initialRating={userBook.rating}
//     initialReview={userBook.reviewText}
//     initialGenreIds={currentGenreIds}
//     action={updateBook.bind(null, userBook.id)}
//     submitLabel="更新する"
// />
//
// ここに書いてみる ↓
export default async function BookDetailPage({params}: PageProps<"/books/[id]">) {
    const { id } = await params;
    const session = await auth();  
    if (!session?.user?.id) {
        return <p>ログインしてください</p>;
    }

    const userBook = await db.query.userBooks.findFirst({
        where: and(eq(userBooks.id, id), eq(userBooks.userId, session.user.id)),
        with: { book: true },
    });
    if (!userBook) {
        return <p>見つかりませんでした</p>;
    }

    const currentGenreLinks = await db
        .select({ genreId: userBookGenres.genreId })
        .from(userBookGenres)
        .where(eq(userBookGenres.userBookId, id));
    const currentGenreIds = currentGenreLinks.map((link) => link.genreId);

    const allGenres = await db.select().from(genres);

    return (
        <div>
            <h2>本を更新</h2>
            <BookShelfForm
                bookTitle={userBook.book.title}
                allGenres={allGenres}
                initialStatus={userBook.status}
                initialRating={userBook.rating}
                initialReview={userBook.reviewText}
                initialGenreIds={currentGenreIds}
                action={updateBook.bind(null, userBook.id)}
                submitLabel="更新する"
            />
        </div>
    );
}
