import { auth, signOut, signIn } from "@/auth";
import Image from "next/image";
import Link from "next/link";
// このヘッダーはshadcn/uiの<Button>ではなく、globals.cssで定義した
// .ice-button（すりガラス風のピルボタン）を直接当てたネイティブの<button>を使う。
// 理由: <Button>はTailwindのユーティリティクラス(bg-primary等)で見た目を
// 作っており、氷UI用CSSと混ぜると「どちらが勝つか」が分かりにくくなるため。

export default async function Header() {
    const session = await auth();
    // ログインしている場合
    if (session) {
        return (
            <header className="ice-header">
                <h1>
                    <Link href={"/"} className="ice-logo">
                        BookShelf
                    </Link>
                </h1>
                <div className="ice-user">
                    {session.user?.image && (
                        <Image
                            src={session.user.image}
                            alt={session.user?.name ?? ""}
                            width={36}
                            height={36}
                            className="ice-avatar"
                        />
                    )}
                    <p className="ice-user-name">{session.user?.name}</p>
                    <form
                        action={async () => {
                            "use server";
                            await signOut();
                        }}
                    >
                        <button type="submit" className="ice-button ice-button--sm">
                            ログアウト
                        </button>
                    </form>
                </div>
            </header>
        );
    }

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
                <button type="submit" className="ice-button ice-button--sm">
                    ログイン
                </button>
            </form>
        </header>
    );
}
