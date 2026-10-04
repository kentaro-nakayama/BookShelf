// ============================================================================
// 本棚カード（自分で書く）
// ----------------------------------------------------------------------------
// 本を1枚のカードとして表示する部品。次の3画面で共通して使う。
//   ホーム画面      (app/page.tsx)          … 登録済みの本 → 詳細ページへ
//   本棚一覧画面    (app/books/page.tsx)    … 登録済みの本 → 詳細ページへ
//   書籍検索画面    (app/books/search/page.tsx) … 未登録の本 → 登録確認ページへ
//
// なぜ部品として切り出したのか:
//   もともとこのJSXは各ページに直接書いていた。同じ見た目のカードが
//   3か所に必要になったため、コピーを3つ持つのではなく1か所にまとめた。
//   こうしておけば「表紙の高さを変えたい」といった修正が1回で済む。
//
// 登録済みの本と検索結果の違いは2点だけで、どちらもプロパティで受け取る。
//   - 押したときの飛び先(href)
//   - 右上のバッジ … 登録済みなら読書ステータス、検索結果なら「本棚に追加」
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
    // カードを押したときの飛び先。
    //   登録済みの本 … `/books/<user_booksのid>`（詳細ページ）
    //                  ※ booksテーブルのidではなくuser_booksテーブルのid。
    //                    「誰の本棚の、どの登録か」を指すのはuser_books側のため
    //   検索結果     … `/books/add?...`（登録確認ページ）
    href: string;
    title: string;
    author: string | null;
    publishedDate: string | null;
    thumbnailUrl: string | null;
    // カードが光るアニメーションのタイミングをずらすための連番。
    // 一覧の中での並び順(0,1,2,...)をそのまま渡す。
    index: number;
    // 右上に出すバッジ。どちらか一方だけを渡す想定。
    //   status      … 登録済みの本の読書ステータス（読みたい/読書中/読了）
    //   actionLabel … 未登録の本に出す操作ラベル（例:「＋ 本棚に追加」）
    // ?を付けた項目は「渡さなくてもよい」という意味になる。
    status?: BookStatus;
    actionLabel?: string;
};

export default function BookCard({
    href,
    title,
    author,
    publishedDate,
    thumbnailUrl,
    index,
    status,
    actionLabel,
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
            href={href}
            className="ice-card ice-card--book w-full lg:w-[calc(50%-10px)]"
            // カードごとに光るタイミングをずらす(0s, 0.5s, 1s, ... )。
            // 0.5s … 上のカードが光ってから次のカードが光り始めるまでの間隔。
            //        小さくするほど光が上から下へ速く流れる。
            // % 12 … 何枚で一巡して同じタイミングに戻るか。
            //
            // この2つは独立に決められない。1周の長さ(globals.cssのice-card-shineで
            // 6秒)を間隔で割った数にする必要がある(6 ÷ 0.5 = 12)。
            // 例えば12より小さくすると、一巡したあと次の周回が始まるまでに
            // 光らない時間ができてしまい、さらに「13枚目が1枚目と同時に光る」
            // といったズレも起きる。
            style={{ "--ice-shine-delay": `${(index % 12) * 0.5}s` } as CSSProperties}
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
                {/* 登録済みの本はステータスバッジ、検索結果は操作ラベルを出す。
                    && は「左が真なら右を表示する」という書き方で、
                    statusが渡されていない場合は何も描画されない。 */}
                {status && (
                    <span
                        className={`ice-status-pill ice-status-pill--${status} self-start`}
                    >
                        {STATUS_LABEL[status]}
                    </span>
                )}
                {actionLabel && (
                    <span className="ice-action-pill self-start">{actionLabel}</span>
                )}

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
