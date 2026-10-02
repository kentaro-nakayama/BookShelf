// ============================================================================
// トップページ = 本棚一覧画面（自分で書く）
// ----------------------------------------------------------------------------
// ログインユーザーが登録した本(user_books)を、本の情報(books)と一緒に一覧表示する。
// ============================================================================

// ----------------------------------------------------------------------------
// 最初に必要なimport
// ----------------------------------------------------------------------------
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

// ----------------------------------------------------------------------------
// TODO 1: ログインチェック
// ----------------------------------------------------------------------------
// 手順（header.tsxで既にやったことの復習）:
//   1. コンポーネントを async function にする
//   2. `const session = await auth();` でログイン状態を取得
//   3. `session` が無ければ（未ログインなら）、
//      「ログインが必要です」のようなメッセージだけ返して終わる
//      （ログインボタン自体はheaderに既にあるので、ここでは案内だけでOK）

// ----------------------------------------------------------------------------
// TODO 2: ログイン中のユーザーの本棚データを取得する
// ----------------------------------------------------------------------------
// Drizzleの「リレーショナルクエリ」という書き方を使う。これまでの
// db.insert(...).values(...) とは違い、データを取得する時はこう書く。
//
// const myBooks = await db.query.userBooks.findMany({
//     where: eq(userBooks.userId, session.user!.id!),
//     // where: 「user_idが、今ログイン中のユーザーのidと一致する行だけ」に絞り込む
//
//     with: {
//         book: true, // 紐づく books テーブルの情報も一緒に取得する
//     },
//     // with: db/schema.ts の relations で定義した関連を指定すると、
//     //       JOINを自分で書かなくても関連データがまとめて取れる
//
//     orderBy: [desc(userBooks.createdAt)],
//     // orderBy: 新しく登録した順（降順）に並べる
// });
//
// ヒント: session.user!.id! の「!」は、これまで使った「undefinedではないと
// 保証する」書き方（drizzle.config.tsなどで使ったパターン）。本当は
// if文でのチェックの方が安全だが、今回は簡易的にこの形でもOK。
//
// 取得した myBooks は配列なので、.length === 0 かどうかで
// 「1件も登録されていない」場合の表示も分岐できる。

// ----------------------------------------------------------------------------
// TODO 3: 画面に表示する
// ----------------------------------------------------------------------------
// myBooks が空配列なら「まだ本が登録されていません」のようなメッセージ、
// 1件以上あれば .map() で1冊ずつ取り出して、タイトル・著者名などを表示する。
//
// 例（1冊分の表示イメージ）:
//   {myBooks.map((userBook) => (
//       <div key={userBook.id}>
//           <p>{userBook.book.title}</p>
//           <p>{userBook.book.author}</p>
//           <p>{userBook.status}</p>
//       </div>
//   ))}
//
// key={userBook.id}: Reactが「配列の中のどの要素か」を見分けるために必要な
// 特別なprops。.map()でリストを作る時は必ず付ける（ユニークな値であれば何でもよい）。
//
// ここに書いてみる ↓
export default async function Home() {
    const session = await auth();
    if (!session) {
        return (
            <p>ログインしてください</p>
        )
    }
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
                <div key={myBook.id}>
                    <p>{myBook.book.title}</p>
                    <p>{myBook.book.author}</p>
                    <p>{myBook.status}</p>
                </div>
            ))}
        </div>
    )

}
