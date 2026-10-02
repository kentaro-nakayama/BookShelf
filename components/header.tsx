import { auth, signOut, signIn } from "@/auth";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function Header() {
    const session = await auth();
    // ログインしている場合
    if (session) {
        return (
            <header>
                <h1>
                    <Link href={"/"}>Bookshelf</Link>
                </h1>
                <div className="user-info">
                    {session.user?.image && (
                        <Image
                            src={session.user.image}
                            alt={session.user?.name ?? ""}
                            width={48}
                            height={48}
                            className="rounded-full"
                        />
                    )}
                    <p>{session.user?.name}</p>
                </div>
                <div className="logout">
                    <form
                        action={async () => {
                            "use server";
                            await signOut();
                        }}
                    >
                        <Button type="submit">ログアウト</Button>
                    </form>
                </div>
            </header>
        );
    }

    return (
        <header>
            <h1>
                <Link href={"/"}>Bookshelf</Link>
            </h1>
            <div className="login">
                <form
                    action={async () => {
                        "use server";
                        await signIn("google");
                    }}
                >
                    <Button type="submit">ログイン</Button>
                </form>
            </div>
        </header>
    );
}
