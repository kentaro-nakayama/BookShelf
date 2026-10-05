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
