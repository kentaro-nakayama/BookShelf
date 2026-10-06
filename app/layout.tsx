import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/header";
// CSSProperties: styleに独自のCSS変数(--sparkle-x など)を渡すための型
import type { CSSProperties } from "react";

// キラッと輝く星15個のデータ。
// delay を3種類に分けているのは、全部が同時に光るとストロボのように
// 見えてしまうため（約0.95秒ずつずらして順番に輝かせている）。
const SPARKLE_STARS = [
    { x: "33%", y: "10%", size: "25px", color: "rgba(255,255,255,1)", delay: "0s" },
    { x: "96%", y: "29%", size: "22px", color: "rgba(255,248,230,0.9)", delay: "0s" },
    { x: "36%", y: "66%", size: "27px", color: "rgba(255,255,255,1)", delay: "0s" },
    { x: "64%", y: "77%", size: "24px", color: "rgba(214,240,255,0.95)", delay: "0s" },
    { x: "77%", y: "62%", size: "27px", color: "rgba(255,255,255,1)", delay: "0s" },
    { x: "69%", y: "23%", size: "22px", color: "rgba(214,240,255,0.95)", delay: "-0.95s" },
    { x: "23%", y: "38%", size: "25px", color: "rgba(255,255,255,1)", delay: "-0.95s" },
    { x: "81%", y: "70%", size: "22px", color: "rgba(255,248,230,0.9)", delay: "-0.95s" },
    { x: "29%", y: "94%", size: "27px", color: "rgba(255,255,255,1)", delay: "-0.95s" },
    { x: "24%", y: "49%", size: "24px", color: "rgba(214,240,255,0.95)", delay: "-0.95s" },
    { x: "5%", y: "22%", size: "27px", color: "rgba(255,255,255,1)", delay: "-1.9s" },
    { x: "58%", y: "51%", size: "24px", color: "rgba(214,240,255,0.95)", delay: "-1.9s" },
    { x: "4%", y: "88%", size: "25px", color: "rgba(255,255,255,1)", delay: "-1.9s" },
    { x: "69%", y: "56%", size: "25px", color: "rgba(255,255,255,1)", delay: "-1.9s" },
    { x: "82%", y: "96%", size: "27px", color: "rgba(255,255,255,1)", delay: "-1.9s" },
];

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

// metadata: ブラウザのタブに出るタイトルや、SNSでURLを共有したときに
// 使われる説明文。create-next-appの初期値のままだったので、
// このアプリの内容に書き換えている。
export const metadata: Metadata = {
    title: "BookShelf",
    description: "読んだ本・読みたい本を、ひとつの本棚にまとめて管理できるアプリ",
};

// viewport: 画面サイズとは別に、ブラウザ自体の見た目(テーマカラー)を
// 指定するためのNext.js専用のexport。
// themeColor: Safariはページの一番上の色をURLバーより上の余白(ステータス
// バー周り)にも反映する仕組みを持っている。ここを指定しないとデフォルトの
// 白になり、氷UIの背景(濃紺)から浮いて見えてしまっていた。
// body の背景グラデーションの開始色(globals.css参照)に合わせている。
// colorScheme: "dark" を伝えておくと、スクロールバーなど
// ブラウザ標準のUI部品もダークテーマ用の配色になる。
export const viewport: Viewport = {
    themeColor: "#05070f",
    colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
    return (
        <html
            lang="en"
            className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
        >
            <body className="min-h-full flex flex-col">
                {/* 夜空の星。画面に固定された背景の飾りなので、
                    読み上げ対象から外す(aria-hidden)。
                    見た目はすべて globals.css の .ice-starfield 側にある。 */}
                <div className="ice-starfield" aria-hidden="true">
                    {/* キラッと輝く星。星1つにつき1つのspanを置いている。
                        光条をその場で回転させるために、星ごとに要素を
                        分ける必要があるため（globals.cssの.ice-sparkle参照）。
                        見た目の計算はCSS側がやるので、ここで渡すのは
                        位置・大きさ・色・光り始めるタイミングの4つだけ。 */}
                    {/* 星座（線は引かない）。実在の星の配置を再現している。
                        形が崩れないよう、星座ごとに縦横比を固定した箱に
                        入れている（globals.cssの.ice-constellation参照）。 */}
                    <span className="ice-constellation ice-constellation--dipper">
                        {/* 星をつなぐ線。角度が自由なのでCSSではなくSVGで描く。
                            viewBoxの横幅は箱の縦横比に合わせてあるので、
                            縦横が均等に拡大され線の太さが歪まない。
                            座標は globals.css の .ice-constellation--dipper に書いた
                            星の位置(%)に対応している。片方だけ動かすとずれるので注意。 */}
                        <svg
                            className="ice-constellation-lines"
                            viewBox="0 0 188.0 100"
                            aria-hidden="true"
                        >
                            {/* Dubhe - Merak - Phecda - Megrez - Dubhe */}
                            <polyline points="11.3,5.0 9.4,43.8 62.4,63.3 84.6,39.1 11.3,5.0" />
                            {/* Megrez - Alioth - Mizar - Alkaid */}
                            <polyline points="84.6,39.1 123.9,46.9 154.5,54.4 178.6,95.0" />
                        </svg>
                    </span>
                    <span className="ice-constellation ice-constellation--scorpius">
                        <svg
                            className="ice-constellation-lines"
                            viewBox="0 0 99.0 100"
                            aria-hidden="true"
                        >
                            {/* 頭(はさみ): Beta - Delta - Pi - Rho */}
                            <polyline points="87.1,5.0 91.3,15.8 92.5,29.2 94.1,41.1" />
                            {/* 胴から尾、毒針まで: Delta - Sigma - Antares - Tau - Epsilon - Mu - Zeta - Eta - Theta - Iota - Kappa - Lambda - Upsilon */}
                            <polyline points="91.3,15.8 74.4,27.2 67.9,30.5 62.7,37.3 51.2,60.6 49.8,75.1 47.6,91.6 33.5,95.0 13.2,94.1 5.0,83.0 9.0,78.8 16.2,71.4 18.5,72.2" />
                        </svg>
                    </span>
                    <span className="ice-constellation ice-constellation--leo">
                        {/* 座標は globals.css の .ice-constellation--leo に書いた
                            星の位置(%)に、箱の縦横比1.11を掛けたもの。
                            片方だけ動かすと線と星がずれるので注意。 */}
                        <svg
                            className="ice-constellation-lines"
                            viewBox="0 0 111.0 100"
                            aria-hidden="true"
                        >
                            {/* 鎌（頭からたてがみ）: Epsilon - Mu - Zeta - Algieba - Eta - Regulus */}
                            <polyline points="105.5,12.5 99.9,5.0 80.5,13.7 77.8,25.7 88.0,36.0 87.2,52.1" />
                            {/* 胴体。Algieba - Zosma - Denebola - Chertan - Regulus と回って、
                                Regulus - Eta - Algieba（鎌の線）でひと続きの輪になる。 */}
                            <polyline points="77.8,25.7 33.9,23.4 5.6,43.4 33.7,40.5 87.2,52.1" />
                            {/* 後ろ足: Chertan - Iota - Sigma - Tau - Upsilon */}
                            <polyline points="33.7,40.5 26.0,56.9 28.2,72.0 22.6,82.7 15.3,95.0" />
                        </svg>
                    </span>
                    <span className="ice-constellation ice-constellation--cassiopeia">
                        {/* 星をつなぐ線。角度が自由なのでCSSではなくSVGで描く。
                            viewBoxの横幅は箱の縦横比に合わせてあるので、
                            縦横が均等に拡大され線の太さが歪まない。
                            座標は globals.css の .ice-constellation--cassiopeia に書いた
                            星の位置(%)に対応している。片方だけ動かすとずれるので注意。 */}
                        <svg
                            className="ice-constellation-lines"
                            viewBox="0 0 184.0 100"
                            aria-hidden="true"
                        >
                            {/* Caph - Schedar - Gamma - Ruchbah - Segin */}
                            <polyline points="9.2,62.0 58.5,95.0 83.9,42.3 129.7,48.3 174.8,5.0" />
                        </svg>
                    </span>

                    {SPARKLE_STARS.map((star, index) => (
                        <span
                            key={index}
                            className="ice-sparkle"
                            style={{
                                "--sparkle-x": star.x,
                                "--sparkle-y": star.y,
                                "--sparkle-size": star.size,
                                "--sparkle-color": star.color,
                                "--sparkle-delay": star.delay,
                            } as CSSProperties}
                        />
                    ))}
                </div>
                <Header />
                {/* 星より手前にページの中身を出すためのラッパー。
                    <main>にしておくと「ここが主要な内容」という意味も伝わり、
                    スクリーンリーダーの「本文へ移動」も効くようになる。 */}
                <main className="ice-content">{children}</main>
            </body>
        </html>
    );
}
