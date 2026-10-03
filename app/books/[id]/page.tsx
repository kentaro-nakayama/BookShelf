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
import { auth } from "@/auth";
import { db } from "@/db";
import { userBooks, userBookGenres, genres } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { updateBook, removeFromShelf } from "./actions";
import { BookShelfForm } from "@/components/book-shelf-form";

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
        <div className="mx-auto max-w-2xl px-6 py-10 flex flex-col gap-6 sm:px-12">
            <h2 className="text-2xl font-bold">本を更新</h2>
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
            <form action={removeFromShelf.bind(null, userBook.id)}>
                <button type="submit" className="ice-button ice-button--danger">
                    本を削除
                </button>
            </form>
        </div>
    );
}
