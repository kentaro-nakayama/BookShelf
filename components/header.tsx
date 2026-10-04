import { auth, signIn } from "@/auth";
import Image from "next/image";
import Link from "next/link";
import Nav from "@/components/nav";
import { SubmitButton } from "@/components/submit-button";
// このヘッダーはshadcn/uiの<Button>ではなく、globals.cssで定義した
// .ice-button（すりガラス風のピルボタン）を直接当てたネイティブの<button>を使う。
// 理由: <Button>はTailwindのユーティリティクラス(bg-primary等)で見た目を
// 作っており、氷UI用CSSと混ぜると「どちらが勝つか」が分かりにくくなるため。

export default async function Header() {
    const session = await auth();
    // ログインしている場合
    if (session) {
        // <>...</> (フラグメント)で、ヘッダーと下部タブバーの2つを返している。
        // 下部タブバーは position:fixed で画面に貼り付けるので、HTML上の
        // 位置がヘッダーの直後であっても、表示は常に画面下端になる。
        // ここでまとめて返しているのは、auth()の呼び出しを1回で済ませるため
        // （layout.tsx側で別途ナビを描画すると、ログイン状態の取得が2回になる）。
        return (
            <>
                <header className="ice-header">
                    <h1>
                        <Link href={"/"} className="ice-logo">
                            BookShelf
                        </Link>
                    </h1>
                    {/* PC用の横並びメニュー。スマホ幅ではCSSで非表示になる */}
                    <Nav variant="desktop" />
                    {/* ユーザー情報。クリックするとアカウント画面へ。
                        ログアウトボタンはここには置かず、アカウント画面に移した。
                        スマホではヘッダーの横幅が限られるため、要素を減らして
                        ロゴとアイコンだけのすっきりした状態にしておきたい。 */}
                    <Link href="/account" className="ice-user">
                        {session.user?.image && (
                            <Image
                                src={session.user.image}
                                alt=""
                                width={36}
                                height={36}
                                className="ice-avatar"
                            />
                        )}
                        <p className="ice-user-name">{session.user?.name}</p>
                    </Link>
                </header>
                {/* スマホ用の下部タブバー。PC幅ではCSSで非表示になる */}
                <Nav variant="bottom" />
            </>
        );
    }

    // 未ログインの場合はナビを出さない。
    // 本棚関連のページはログインしないと中身がないため（要件定義書8章の
    // 「未ログイン時は本棚関連ページへのアクセスを制限」と揃えている）。
    return (
        <header className="ice-header">
            <h1>
                <Link href={"/"} className="ice-logo">
                    BookShelf
                </Link>
            </h1>
            <form
                action={async () => {
                    "use server";
                    await signIn("google");
                }}
            >
                <SubmitButton className="ice-button ice-button--sm" loadingLabel="ログインしています…">
                    ログイン
                </SubmitButton>
            </form>
        </header>
    );
}
