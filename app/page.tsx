// ============================================================================
// トップページ（自分で書く・仮実装）
// ----------------------------------------------------------------------------
// ログイン中かどうかで表示を出し分ける。新しいページ・ルーティングは作らず、
// 同じ `/` の中で分岐させる。
// ============================================================================

// ----------------------------------------------------------------------------
// 追加で必要なimport
// ----------------------------------------------------------------------------
// auth: auth.ts で `export const { ..., auth } = NextAuth({...})` として作った、
//       「今ログイン中かどうか」をサーバー側で調べる関数
// signOut: 同じく auth.ts からexportした、ログアウト処理を開始する関数
//          （signInと対になる関数。使い方はsignInと同じ形）
//
// import { auth, signIn, signOut } from "@/auth";

// ----------------------------------------------------------------------------
// 最初に必要なimport（前回までで書いたもの、そのまま残す）
// ----------------------------------------------------------------------------
import { Button } from "@/components/ui/button";
// Image: next/imageが提供するコンポーネント。外部画像を最適化・キャッシュして
// 配信してくれる（素の<img>のまま直接外部サーバーに何度もリクエストすると、
// レート制限(429エラー)にかかりやすい問題があったため、こちらに切り替える）。
// 使う外部ドメインは next.config.ts の images.remotePatterns で許可が必要。
import Image from "next/image";

// ----------------------------------------------------------------------------
// TODO: ログイン状態で表示を分岐する
// ----------------------------------------------------------------------------
// 手順:
//   1. コンポーネントを async function にする（auth()は非同期関数のため、
//      中でawaitする必要がある。これまでのdb/seed.tsのmain()と同じ考え方）
//   2. `const session = await auth();` でログイン状態を取得
//   3. `session` が存在する（ログイン中）か `null`（未ログイン）かで
//      返すJSXを分岐させる
//
// 【ログイン中の場合に表示したいもの】
//   - ユーザー名: session.user?.name
//   - ユーザー画像: session.user?.image（<img>タグで表示できる）
//   - ログアウトボタン:
//     <form action={async () => {
//         "use server";
//         await signOut();
//     }}>
//         <Button type="submit">ログアウト</Button>
//     </form>
//     （前回書いたsignInのフォームと全く同じ形。signOutに差し替えるだけ）
//
// 【未ログインの場合に表示するもの】
//   → 前回まで書いていたGoogleログインボタンのフォームをそのまま使う
//
// ここに書いてみる ↓
import { auth, signIn, signOut } from "@/auth";

export default async function Home() {
    const session = await auth();

    if (session) {
        return (
            <div>
                <p>{session.user?.name}</p>
                {session.user?.image && (
                    // width/height: next/imageは表示サイズの指定が必須
                    // （レイアウトのガタつきを防ぐため、画像が読み込まれる前から
                    //   領域を確保できるようにする仕組み）
                    <Image
                        src={session.user.image}
                        alt={session.user?.name ?? ""}
                        width={48}
                        height={48}
                        className="rounded-full"
                    />
                )}
                <form action={async () => {
                    "use server";
                    await signOut();
                }}>
                    <Button type="submit">ログアウト</Button>
                </form>
            </div>
        )
    }

    return (
        <div>
            <form action={async () => {
            'use server';
            await signIn("google");
        }}>
            <Button type="submit">Googleアカウントでログイン</Button>
        </form>
        </div>
    )
}
