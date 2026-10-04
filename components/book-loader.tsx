// ============================================================================
// ローディング表示（自分で書く）
// ----------------------------------------------------------------------------
// 画面中央で本のページがめくれ続けるアニメーション。
// データの取得待ちの間に表示する。
//
// 使い方:
//   app/loading.tsx から呼ぶと、Next.jsがページの読み込み中に自動で
//   表示してくれる（loading.tsx の仕組みについては app/loading.tsx を参照）。
//   それ以外の場所でも、読み込み待ちを出したいところで普通に使える。
//
// 見た目はすべて globals.css の .ice-loader-* 側で作っている。
// このファイルは「表紙2枚とめくれるページ4枚」という骨組みだけを用意する。
// ============================================================================

// めくれるページの枚数と、めくり1周の長さ。
// 1周をこの枚数で割った間隔ずつ各ページの開始をずらし、
// 「常にどれかがめくれている」状態を作っている。
//
// CYCLE_SECONDS は globals.css の
// `animation: ice-page-flip 1.4s ...` と必ず同じ値にすること。
// ずれると開始のタイミングが1周に均等に散らばらず、
// めくりが途切れる瞬間ができてしまう。
// 小さくするほどページが速くめくれる。
const PAGE_COUNT = 4;
const CYCLE_SECONDS = 1.4;

type BookLoaderProps = {
    // 画面中央に大きく出すか(true)、その場に小さく出すか(false)。
    // ページ全体の読み込み待ちは true、画面の一部だけなら false を想定。
    fullScreen?: boolean;
    // アニメーションの下に出す文言
    label?: string;
};

export default function BookLoader({
    fullScreen = true,
    label = "読み込み中…",
}: BookLoaderProps) {
    return (
        // role="status" と aria-live="polite":
        //   画面を見られない人にも「今読み込み中である」ことを伝えるための指定。
        //   この中身が変わったとき、スクリーンリーダーが読み上げてくれる。
        //   polite は「今喋っていることを遮らず、区切りのいいところで伝える」の意味。
        <div
            className={`ice-loader${fullScreen ? " ice-loader--full" : ""}`}
            role="status"
            aria-live="polite"
        >
            {/* aria-hidden: 本の絵は飾りなので読み上げさせない。
                「読み込み中…」という文字のほうで意味は伝わる。 */}
            <div className="ice-loader-book" aria-hidden="true">
                {/* Array.from({length: n}) は「要素がn個の配列」を作る書き方。
                    ここでは中身は使わず、ページを4枚並べるためだけに使っている。 */}
                {Array.from({ length: PAGE_COUNT }).map((_, index) => (
                    <span
                        key={index}
                        className="ice-loader-page"
                        // ページごとに、めくり始めるタイミングをずらす。
                        // 1.4秒 ÷ 4枚 = 0.35秒ずつずらすと、1周の中に均等に散らばる。
                        style={{
                            animationDelay: `${(index * CYCLE_SECONDS) / PAGE_COUNT}s`,
                        }}
                    />
                ))}
            </div>
            <p className="ice-loader-text">{label}</p>
        </div>
    );
}
