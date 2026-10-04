// ============================================================================
// グローバルナビゲーション（自分で書く）
// ----------------------------------------------------------------------------
// 「ホーム」「リスト」「探す」「アカウント」の4つを行き来するメニュー。
//
// 設計方針:
//   要件定義書3.1で「主な利用シーンはスマートフォン」と決めたので、
//   スマホでは画面下部に固定したタブバー（親指が届く位置）、
//   PCではヘッダー内の横並びメニューという2つの見た目を用意する。
//   どちらも同じこのコンポーネントで、variantプロパティで切り替える。
//   表示/非表示の切り替えはCSSのメディアクエリ側で行う（globals.css参照）。
//
// なぜClient Component("use client")なのか:
//   「今どのページにいるか」を知ってタブをハイライトするために
//   usePathname()を使う。これはNext.jsの仕様でClient Component専用のフック
//   （Server Componentから現在のURLを読むことはできない）。
//   ただしこのコンポーネントは初回表示時にサーバー側でHTMLになるので、
//   「クライアント側で表示が遅れる」ということはない。
// ============================================================================

"use client";

import { Book } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// ----------------------------------------------------------------------------
// アイコン（インラインSVG）
// ----------------------------------------------------------------------------
// 本棚タブ以外はライブラリを使わず、必要なSVGを自分で書いている。
// stroke="currentColor" にしておくと、CSS側の color の指定がそのまま
// 線の色になる。これで「選択中のタブだけ明るくする」といった色の制御を
// CSSだけで完結できる（SVG側に色を書かなくて済む）。
// aria-hidden: アイコンの隣に必ずテキストラベルを置いているので、
//              スクリーンリーダーには読ませる必要がない（二重に読まれるのを防ぐ）。
const iconProps = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
};

function HomeIcon() {
    return (
        <svg {...iconProps}>
            <path d="M3 10.5 12 3.5l9 7" />
            <path d="M5.5 9.5V20h13V9.5" />
            <path d="M10 20v-5.5h4V20" />
        </svg>
    );
}

// 本棚タブだけアイコンライブラリ(lucide-react)のものを使っている。
// そのまま <Book /> と書くと既定の24pxで描かれ、自作アイコン(22px)より
// 一回り大きくなってタブの並びが不揃いになるため、
// 他と同じサイズ・線の太さを指定して包んでいる。
function BookIcon() {
    return <Book size={22} strokeWidth={1.6} aria-hidden />;
}

function BookmarkListIcon() {
    // 「本棚」は本が並んだ棚、「マイリスト」は箇条書きのリスト、という
    // 見た目の違いで区別する（同じアイコンだとどちらのタブか分からないため）
    return (
        <svg {...iconProps}>
            <path d="M9 6h11" />
            <path d="M9 12h11" />
            <path d="M9 18h11" />
            <path d="M4.5 6h.01" />
            <path d="M4.5 12h.01" />
            <path d="M4.5 18h.01" />
        </svg>
    );
}

function SearchIcon() {
    return (
        <svg {...iconProps}>
            <circle cx="11" cy="11" r="6.5" />
            <path d="m16 16 4 4" />
        </svg>
    );
}

function AccountIcon() {
    return (
        <svg {...iconProps}>
            <circle cx="12" cy="8.5" r="3.8" />
            <path d="M4.8 20c0-3.6 3.2-5.8 7.2-5.8s7.2 2.2 7.2 5.8" />
        </svg>
    );
}

// ----------------------------------------------------------------------------
// メニュー項目の定義
// ----------------------------------------------------------------------------
// isActive: 「このタブを選択中として光らせるか」を、現在のURL(pathname)から
//           判定する関数。単純な href === pathname の比較では足りないため、
//           項目ごとに判定ルールを持たせている。
//           例: 本の詳細ページ(/books/xxxx)にいるときは「リスト」を選択中に、
//               登録確認ページ(/books/add)にいるときは「探す」を選択中にしたい。
// emphasis: 中央に大きく出す強調表示をするか（「探す」だけtrue）。
//           このアプリで一番使う操作は「本を探して登録する」なので、
//           どの画面からでも押しやすい中央に置いて目立たせる。
const NAV_ITEMS = [
    {
        href: "/",
        label: "ホーム",
        Icon: HomeIcon,
        emphasis: false,
        // ホームは完全一致のみ。前方一致にすると全ページで光ってしまう
        isActive: (pathname: string) => pathname === "/",
    },
    {
        href: "/books",
        label: "本棚",
        Icon: BookIcon,
        emphasis: false,
        // /books 自体と、本の詳細ページ(/books/<id>)で光らせる。
        // 「探す」側の画面(/books/search, /books/add)は除外する。
        isActive: (pathname: string) =>
            pathname === "/books" ||
            (pathname.startsWith("/books/") &&
                !pathname.startsWith("/books/search") &&
                !pathname.startsWith("/books/add")),
    },
    {
        href: "/books/search",
        label: "探す",
        Icon: SearchIcon,
        emphasis: true,
        // 検索画面と、その続きの登録確認画面(/books/add)をひとまとめに扱う
        isActive: (pathname: string) =>
            pathname.startsWith("/books/search") || pathname.startsWith("/books/add"),
    },
    {
        href: "/list",
        label: "マイリスト",
        Icon: BookmarkListIcon,
        emphasis: false,
        isActive: (pathname: string) => pathname.startsWith("/list"),
    },
    {
        href: "/account",
        label: "アカウント",
        Icon: AccountIcon,
        emphasis: false,
        isActive: (pathname: string) => pathname.startsWith("/account"),
    },
];

export default function Nav({ variant }: { variant: "bottom" | "desktop" }) {
    const pathname = usePathname();

    return (
        // aria-label: 画面内にnavが複数ある（下部タブとヘッダー内メニュー）ため、
        // スクリーンリーダー利用者が区別できるように名前を付けている。
        <nav
            className={`ice-nav ice-nav--${variant}`}
            aria-label={variant === "bottom" ? "メインメニュー" : "メニュー"}
        >
            {NAV_ITEMS.map((item) => {
                const active = item.isActive(pathname);
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={[
                            "ice-nav-item",
                            item.emphasis ? "ice-nav-item--center" : "",
                            active ? "ice-nav-item--active" : "",
                        ]
                            // 条件に合わず空文字になったものを捨ててから半角スペースで連結する。
                            // こうしないと "ice-nav-item  active" のように余計な空白が入る。
                            .filter(Boolean)
                            .join(" ")}
                        // aria-current="page": 「これが今開いているページ」という意味を
                        // 支援技術に伝える標準の属性。見た目のハイライトだけだと
                        // 画面を見られない人に情報が伝わらないため合わせて付けている。
                        aria-current={active ? "page" : undefined}
                    >
                        <span className="ice-nav-icon">
                            <item.Icon />
                        </span>
                        <span className="ice-nav-label">{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
