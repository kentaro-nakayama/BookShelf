// ============================================================================
// トップページ = 本棚一覧画面（自分で書く）
// ----------------------------------------------------------------------------
// ログインユーザーが登録した本(user_books)を、本の情報(books)と一緒に一覧表示する。
// ============================================================================

// ----------------------------------------------------------------------------
// 最初に必要なimport
// ----------------------------------------------------------------------------
import Image from "next/image";
import Link from "next/link";
// auth:      今ログイン中かどうかを調べる関数（header.tsxで使ったのと同じ）
import { auth } from "@/auth";
//
// db:        DBクライアント
import { db } from "@/db";
//
// userBooks: db/schema.ts の user_books テーブル定義
import { userBooks } from "@/db/schema";
//
// eq, desc:  SQLの条件・並び順を書くためのヘルパー関数（drizzle-ormから提供）
import { eq, desc } from "drizzle-orm";

export default async function Home() {
    // ログイン状態を取得
    const session = await auth();
    // 未ログインの場合はメッセージを表示して終了
    if (!session) {
        return (
            <p>ログインしてください</p>
        )
    }
    // ログインしている場合
    // ユーザーが本棚に登録している本をすべて取得
    const myBooks = await db.query.userBooks.findMany({
        where: eq(userBooks.userId, session.user!.id!),
        //「user_idが、今ログイン中のユーザーのidと一致する行だけ」に絞り込む
        with: {
            book: true, // 紐づく books テーブルの情報も一緒に取得する
        },
        orderBy: [
            desc(userBooks.createdAt)
        ]
    })

    if (myBooks.length === 0) {
        return (
            <p>本が登録されていません</p>
        )
    }

    return (
        <div>
            {myBooks.map((myBook) => (
                <div key={myBook.book.id}>
                        <p>{myBook.book.title}</p>
                        <p>{myBook.book.author}</p>
                        <div className="book-image">
                            {myBook.book.thumbnail_url && <Image src={myBook.book.thumbnail_url} alt={myBook.book.title} width={128} height={192} />}
                        </div>
                        <p>{myBook.book.published_date}</p>
                        <Link href={`/books/${myBook.id}`}>詳細を見る</Link>
                </div>
            ))}
        </div>
    )
}
