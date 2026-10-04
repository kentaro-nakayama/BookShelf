// ============================================================================
// マイリスト画面のServer Action
// ----------------------------------------------------------------------------
// リストの作成・削除を行う。
// 「本をリストに入れる／外す」操作はここではなく、本の詳細画面
// (app/books/[id]/actions.ts の updateBook) 側で行っている
// （ジャンルの設定と同じ場所でまとめて扱うため）。
// ============================================================================

"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/db";
import { bookLists } from "@/db/schema";

// リスト名の最大文字数。DBのtext型に上限はないが、
// 画面の表示が崩れない範囲に収めるためアプリ側で制限する。
const NAME_MAX_LENGTH = 50;
const DESCRIPTION_MAX_LENGTH = 200;

// PostgreSQLの一意制約違反（エラーコード23505）かどうかを判定する。
//
// 注意: Drizzleは発生したエラーを自前のErrorで包み直して投げるため、
// DBドライバが付けたエラーコードは error.code ではなく
// error.cause.code の位置に入っている（実際のエラーを確認して判明）。
// 将来Drizzleの実装が変わって直接codeを持つ可能性もあるので、両方見る。
function isUniqueViolation(error: unknown): boolean {
    const UNIQUE_VIOLATION = "23505";
    if (typeof error !== "object" || error === null) return false;

    if ("code" in error && error.code === UNIQUE_VIOLATION) return true;

    const cause = (error as { cause?: unknown }).cause;
    if (typeof cause === "object" && cause !== null && "code" in cause) {
        return cause.code === UNIQUE_VIOLATION;
    }
    return false;
}

// リストを新規作成する。
// <form action={createList}> という形で、マイリスト画面から直接呼ばれる。
export async function createList(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("ログインが必要です");
    }

    const nameRaw = formData.get("name");
    // trim(): 前後の空白を取り除く。「   」のような空白だけの名前を弾くため。
    const name = typeof nameRaw === "string" ? nameRaw.trim() : "";

    const descriptionRaw = formData.get("description");
    const description =
        typeof descriptionRaw === "string" && descriptionRaw.trim() !== ""
            ? descriptionRaw.trim()
            : null;

    // --- 入力チェック -------------------------------------------------------
    // エラーはURLのクエリパラメータで画面に伝える。
    // こうするとクライアント側のJavaScriptなしでエラー表示ができる
    // （この画面の他の部分と同じ、フォームの標準機能だけで完結する方針）。
    if (name === "") {
        redirect("/list?error=empty");
    }
    if (name.length > NAME_MAX_LENGTH) {
        redirect("/list?error=too_long");
    }
    if (description && description.length > DESCRIPTION_MAX_LENGTH) {
        redirect("/list?error=too_long");
    }

    try {
        await db.insert(bookLists).values({
            userId: session.user.id,
            name,
            description,
        });
    } catch (error) {
        // book_lists には UNIQUE (user_id, name) を張っているため、
        // 同じ名前のリストを作ろうとするとDBがエラーを返す。
        // 「アプリ側で事前にSELECTして存在チェックする」方法もあるが、
        // チェックから挿入までの間に別の操作が入ると重複を防げないため、
        // DBの制約に任せてエラーを拾うほうが確実。
        if (isUniqueViolation(error)) {
            redirect("/list?error=duplicate");
        }
        throw error;
    }

    // revalidatePath: このパスのキャッシュを破棄して次の表示で作り直させる。
    // これがないと、作ったばかりのリストが一覧に出ないことがある。
    revalidatePath("/list");
    redirect("/list");
}

// リストを削除する。<form action={deleteList.bind(null, listId)}> で呼ぶ。
//
// book_list_items は db/schema.ts で onDelete: "cascade" を指定しているので、
// リスト本体を消せば中身の紐付けもDBが自動で削除する。
// 紐付けが消えるだけで、本棚の本(user_books)自体は消えない。
export async function deleteList(listId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("ログインが必要です");
    }

    // whereに user_id の条件を入れることで認可チェックを兼ねている。
    // 他人のリストIDを指定されても0件ヒットになり、削除されない。
    await db
        .delete(bookLists)
        .where(and(eq(bookLists.id, listId), eq(bookLists.userId, session.user.id)));

    revalidatePath("/list");
    redirect("/list");
}
