// ============================================================================
// 本棚カード（自分で書く）
// ----------------------------------------------------------------------------
// 本棚に登録済みの本を1枚のカードとして表示する部品。
// ホーム画面(app/page.tsx)とリスト画面(app/books/page.tsx)の両方で使う。
//
// なぜ部品として切り出したのか:
//   もともとこのJSXはapp/page.tsxの中に直接書いていた。リスト画面でも
//   まったく同じ見た目のカードが必要になったため、コピーして2か所に
//   同じコードを持つのではなく、1か所にまとめて両方から呼ぶ形にした。
//   こうしておけば「表紙の高さを変えたい」といった修正が1回で済む。
//
// レイアウト:
//   高さ200pxの横長カード。左に表紙、右にステータスバッジと書誌情報を置く。
//     ┌──────────────────────────┐
//     │ ┌────┐  [status]              │
//     │ │画像│  ┌───────────────┐ │
//     │ │    │  │ タイトル / 著者 / 出版日 │ │
//     │ └────┘  └───────────────┘ │
//     └──────────────────────────┘
//   カード全体が詳細ページへのリンクになっている（中に「詳細を見る」ボタンは
//   置かない）。スマホでは指で押せる面積が広いほど扱いやすいため、
//   カード全体を押せるようにしたほうが小さなボタンを狙うより確実
//   （要件定義書3.1・8章のスマホ優先の方針）。
// ============================================================================

import Image from "next/image";
import Link from "next/link";
// CSSProperties: styleプロパティに独自CSS変数(--ice-shine-delay)を
// 渡すための型。TypeScriptは標準だと style に "--任意の名前" のような
// キーを許可してくれないので、CSSPropertiesに手動でその型を追加している。
import type { CSSProperties } from "react";

// ステータスの内部値(DB上の文字列)と、画面に出す日本語ラベルを対応付ける表。
// バッジの色はglobals.cssの.ice-status-pill--<内部値>側で定義している。
// as const: このオブジェクトを「読み取り専用で、値も文字列リテラル型として
//           扱う」という指定。これで下のBookStatus型が
//           "want_to_read" | "reading" | "finished" という
//           「3つのうちどれか」を表す型になる（単なるstringにならない）。
export const STATUS_LABEL = {
    want_to_read: "読みたい",
    reading: "読書中",
    finished: "読了",
} as const;

// keyof typeof STATUS_LABEL = 上の表のキーの型
// = "want_to_read" | "reading" | "finished"
// DBのenum_status(db/schema.ts)と同じ3つの値になる。
export type BookStatus = keyof typeof STATUS_LABEL;

// このコンポーネントが受け取るデータの形。
// user_booksテーブルとbooksテーブルの必要な項目だけを受け取るようにして、
// DBの行をそのまま渡さなくても使えるようにしている。
type BookCardProps = {
    // 詳細ページ(/books/<id>)へのリンクに使うID。
    // booksテーブルのidではなくuser_booksテーブルのidである点に注意
    // （「誰の本棚の、どの登録か」を指すのはuser_books側のidのため）。
    userBookId: string;
    title: string;
    author: string | null;
    publishedDate: string | null;
    thumbnailUrl: string | null;
    status: BookStatus;
    // カードが光るアニメーションのタイミングをずらすための連番。
    // 一覧の中での並び順(0,1,2,...)をそのまま渡す。
    index: number;
};

export default function BookCard({
    userBookId,
    title,
    author,
    publishedDate,
    thumbnailUrl,
    status,
    index,
}: BookCardProps) {
    return (
        // カード全体が<a>（＝詳細ページへのリンク）になっている。
        // クラスの意味:
        //   ice-card        … 氷UIのガラス風カード（背景・枠線・光る演出）
        //   ice-card--book  … それを横長・高さ200pxに作り替える指定
        //   w-full          … スマホでは画面幅いっぱい
        //   lg:w-[calc(50%-10px)]
        //                   … 画面が広いとき(1024px以上)は横に2枚並べる。
        //                     一覧側の隙間がgap-5(=20px)なので、
        //                     50%から隙間の半分(10px)を引くとちょうど2列になる。
        <Link
            href={`/books/${userBookId}`}
            className="ice-card ice-card--book w-full lg:w-[calc(50%-10px)]"
            // カードごとに光るタイミングをずらす(0s, 1s, 2s, ... を6枚ごとに繰り返す)。
            // 1周が6秒(globals.cssのice-card-shine)なので、6枚で1秒ずつずらすと
            // サイクル全体に均等に散らばる。
            style={{ "--ice-shine-delay": `${(index % 6) * 1}s` } as CSSProperties}
        >
            {/* --- 左: 表紙 ---------------------------------------------- */}
            <div className="ice-book-cover">
                {thumbnailUrl ? (
                    <Image
                        src={thumbnailUrl}
                        // alt="": 本のタイトルはすぐ右側にテキストで出ているため、
                        // 画像側で読み上げさせると同じ情報が2回読まれてしまう。
                        // 空文字にしておくと読み飛ばしてくれる。
                        alt=""
                        fill
                        // sizes: 表示される幅をブラウザに教えるための指定。
                        // この枠は最大でも120pxなので、無駄に大きな画像を
                        // ダウンロードしないで済む（スマホ回線への配慮）。
                        sizes="120px"
                        style={{ objectFit: "cover" }}
                    />
                ) : (
                    // 表紙画像がない本は、タイトルの1文字目を大きく出して代わりにする
                    <span className="text-3xl font-bold opacity-50">
                        {title.slice(0, 1)}
                    </span>
                )}
            </div>

            {/* --- 右: ステータス + 書誌情報 ------------------------------- */}
            <div className="ice-book-body">
                <span
                    className={`ice-status-pill ice-status-pill--${status} self-start`}
                >
                    {STATUS_LABEL[status]}
                </span>

                <div className="ice-book-info">
                    <p className="ice-card-title">{title}</p>
                    {/* 著者・出版日はDB上NULLがありうる（booksテーブルの定義を参照）。
                        その場合は行ごと出さずに詰める。 */}
                    {author && <p className="ice-card-author">{author}</p>}
                    {publishedDate && <p className="ice-card-meta">{publishedDate}</p>}
                </div>
            </div>
        </Link>
    );
}
