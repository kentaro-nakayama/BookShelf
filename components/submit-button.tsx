// ============================================================================
// 送信ボタン（自分で書く）
// ----------------------------------------------------------------------------
// 押した瞬間にローディング（本のページめくり）を画面中央に出す送信ボタン。
//
// なぜ専用の部品が必要だったのか:
//   app/loading.tsx のローディングは「別のページへ移動するとき」にしか
//   出ない。一方このアプリの更新・作成・削除・検索は <form> の送信
//   （Server Action）で行っており、これはページ移動ではないため
//   loading.tsx の対象外だった。
//   そのため「更新する」などを押しても画面が何も変わらず、
//   処理が走っているのか分からない状態になっていた。
//
// 仕組み:
//   useFormStatus() は「自分が入っている<form>が今送信中かどうか」を
//   教えてくれるReactのフック。送信中(pending)の間だけ、
//   画面全体を覆うローディングを出す。
//
//   注意: このフックは「<form>の中にある子コンポーネント」でしか動かない。
//   フォームと同じコンポーネントに書いても pending は常に false のままになる。
//   ボタンを別部品に切り出しているのはそのため（Next.jsの公式ドキュメント
//   node_modules/next/dist/docs/01-app/02-guides/forms.md でも同じ構成）。
// ============================================================================

"use client";

import { useFormStatus } from "react-dom";
import BookLoader from "@/components/book-loader";

type SubmitButtonProps = {
    // ボタンに表示する文字
    children: React.ReactNode;
    // 見た目のクラス（.ice-button など）。呼び出し側で自由に決める
    className?: string;
    // ローディング中に出す文言。操作によって変えられるようにしている
    //（例: 削除なら「削除しています…」）
    loadingLabel?: string;
};

export function SubmitButton({
    children,
    className = "ice-button",
    loadingLabel = "処理中…",
}: SubmitButtonProps) {
    const { pending } = useFormStatus();

    return (
        <>
            <button
                type="submit"
                className={className}
                // 送信中はボタンを押せなくする。
                // 二重送信（同じリストが2つできる等）を防ぐ意味もある。
                disabled={pending}
                // aria-busy: 「この操作は進行中」であることを支援技術に伝える属性
                aria-busy={pending}
            >
                {children}
            </button>

            {/* 送信中だけ、画面全体を覆うローディングを出す。
                position: fixed で画面に貼り付けるので、このJSXが
                ボタンの隣にあってもローディング自体は画面中央に表示される。 */}
            {pending && (
                <div className="ice-loader-overlay">
                    <BookLoader fullScreen={false} label={loadingLabel} />
                </div>
            )}
        </>
    );
}
