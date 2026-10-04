// ============================================================================
// アカウント画面（自分で書く）
// ----------------------------------------------------------------------------
// URL: /account
//
// 要件定義書6章の「プロフィール／設定画面」にあたる画面。
// グローバルナビの「アカウント」から開く。
//
// ここに置いているもの:
//   - ログイン中のアカウント情報（アイコン・名前・メールアドレス）
//   - 本棚の件数（ステータス別。押すとリスト画面の絞り込みに飛ぶ）
//   - ログアウトボタン
//
// ログアウトボタンをこの画面に置いた理由:
//   以前はヘッダーに常に出していたが、スマホではヘッダーの横幅が足りず
//   ロゴ・ナビ・ユーザー名・ログアウトが窮屈に並んでしまう。
//   ログアウトは毎日押すものではないので、アカウント画面にまとめて
//   ヘッダーを軽くした（要件定義書3.1のスマホ優先の方針）。
// ============================================================================

import Image from "next/image";
import Link from "next/link";
// signOut: ログアウトを実行する関数（auth.tsからexportしている）
import { auth, signOut } from "@/auth";
import { db } from "@/db";
import { userBooks } from "@/db/schema";
// count: SQLのCOUNT(*)（件数を数える）を使うためのヘルパー
import { eq, count } from "drizzle-orm";
import { STATUS_LABEL, type BookStatus } from "@/components/book-card";

export default async function AccountPage() {
    const session = await auth();

    // 未ログイン時はアカウント情報を出さずホームへ案内する（要件定義書8章）
    if (!session) {
        return (
            <div className="mx-auto max-w-5xl px-6 py-16 flex flex-col items-center gap-4 text-center sm:px-12">
                <p>ログインしていません</p>
                <Link href="/" className="ice-button">
                    ホームへ
                </Link>
            </div>
        );
    }

    // --- ステータス別の件数を取得 -------------------------------------------
    // ホーム画面では全件を取得してJavaScript側で数えていたが、ここでは
    // 本の中身（タイトルや表紙）は一切使わず件数だけが欲しい。
    // そのためDB側で数えてもらい、受け取るデータを3行だけに抑えている。
    //
    // 生成されるSQLのイメージ:
    //   SELECT status, COUNT(*) FROM user_books WHERE user_id = ? GROUP BY status
    //
    // groupBy: 指定した列の同じ値ごとにまとめて集計する（＝ステータスごとの件数）
    const statusCounts = await db
        .select({
            status: userBooks.status,
            // count()が返すのは件数。asで結果のプロパティ名を決める
            total: count(),
        })
        .from(userBooks)
        .where(eq(userBooks.userId, session.user!.id!))
        .groupBy(userBooks.status);

    // 上のSQLは「1冊もないステータス」の行を返さない（GROUP BYは存在する値だけを
    // まとめるため）。画面には「読みたい 0冊」も出したいので、
    // 3種類すべてを並べたうえで、取得できた件数を当てはめる形にする。
    //
    // Object.keys(STATUS_LABEL): 表のキーの配列
    //   = ["want_to_read", "reading", "finished"]
    const summary = (Object.keys(STATUS_LABEL) as BookStatus[]).map((status) => {
        // find(): 配列から条件に合う最初の要素を探す。見つからなければundefined。
        // ?.total で「見つかったときだけtotalを読む」、
        // ?? 0 で「undefinedだったら0にする」という意味になる。
        const found = statusCounts.find((row) => row.status === status);
        return {
            status,
            label: STATUS_LABEL[status],
            count: found?.total ?? 0,
        };
    });

    // 全ステータスの件数を足し合わせた総冊数。
    // reduce(): 配列を1つの値にまとめる関数。ここでは合計を出している。
    const totalCount = summary.reduce((sum, item) => sum + item.count, 0);

    return (
        <div className="mx-auto max-w-2xl px-6 py-10 flex flex-col gap-7 sm:px-12">
            <h2 className="text-2xl font-bold">アカウント</h2>

            {/* --- プロフィール --------------------------------------------- */}
            <div className="ice-card gap-4">
                <div className="flex items-center gap-4">
                    {session.user?.image && (
                        <Image
                            src={session.user.image}
                            // alt="": 隣に名前がテキストで出ているので、
                            // 画像側は読み上げ不要（空文字にすると読み飛ばされる）
                            alt=""
                            width={64}
                            height={64}
                            className="ice-avatar"
                        />
                    )}
                    <div className="flex flex-col gap-1 overflow-hidden">
                        <p className="text-lg font-bold">{session.user?.name}</p>
                        {/* break-all: 長いメールアドレスがスマホ幅を押し広げて
                            横スクロールを発生させないように折り返す
                            （要件定義書8章の「横スクロールが発生しないレイアウト」） */}
                        <p className="text-sm text-[color:var(--ice-text-muted)] break-all">
                            {session.user?.email}
                        </p>
                    </div>
                </div>
                <p className="text-xs text-[color:var(--ice-text-muted)]">
                    名前・アイコン・メールアドレスはGoogleアカウントの情報を
                    そのまま表示しています。変更する場合はGoogleアカウント側で
                    変更してください。
                </p>
            </div>

            {/* --- 本棚の件数 ----------------------------------------------- */}
            <div className="ice-card gap-4">
                <div className="flex items-baseline justify-between gap-3">
                    <p className="font-bold">登録した本</p>
                    <p className="text-sm text-[color:var(--ice-text-muted)]">
                        全{totalCount}冊
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {summary.map((item) => (
                        // 押すとリスト画面がそのステータスで絞り込まれた状態で開く
                        <Link
                            key={item.status}
                            href={`/books?status=${item.status}`}
                            className={`ice-status-pill ice-status-pill--${item.status}`}
                        >
                            {item.label} {item.count}冊
                        </Link>
                    ))}
                </div>
            </div>

            {/* --- ログアウト ----------------------------------------------- */}
            <div className="ice-card items-start gap-3">
                <p className="font-bold">ログアウト</p>
                <p className="text-sm text-[color:var(--ice-text-muted)]">
                    ログアウトしても本棚のデータは消えません。
                    次回同じGoogleアカウントでログインすれば元の本棚が表示されます。
                </p>
                {/* Server Action: フォーム送信時にサーバー側でsignOut()を実行する。
                    "use server"を関数の先頭に書くことで、この関数が
                    サーバーで動くことをNext.jsに伝えている（header.tsxと同じ仕組み）。 */}
                <form
                    action={async () => {
                        "use server";
                        await signOut();
                    }}
                >
                    <button type="submit" className="ice-button ice-button--danger">
                        ログアウトする
                    </button>
                </form>
            </div>
        </div>
    );
}
