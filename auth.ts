// ============================================================================
// Auth.js (NextAuth v5) 設定ファイル（自分で書く）
// ----------------------------------------------------------------------------
// ここでGoogleログインの設定と、db/schema.tsの users/accounts/sessions を
// Auth.jsに接続する。書いた内容は `auth`, `signIn`, `signOut`, `handlers` という
// 名前でexportし、アプリの他の場所（ログインボタンやAPIルート）から使う。
//
// ※ 事前にnode_modules内の型定義を確認済み。インストールされているバージョンでは
//   DrizzleAdapter(db, { usersTable, accountsTable, sessionsTable, ... }) という
//   形でテーブルを渡す必要がある（省略した場合の自動検出は保証されないため、
//   明示的に渡す）。
// ============================================================================

// ----------------------------------------------------------------------------
// 最初に必要なimport
// ----------------------------------------------------------------------------
// NextAuth: 設定を渡して { handlers, auth, signIn, signOut } を作る関数
import NextAuth from "next-auth";
//
// Google: Googleログイン用のプロバイダー（他にGitHub等も同じ形で用意されている）
import Google from "next-auth/providers/google";
//
// DrizzleAdapter: Auth.jsとDrizzle(DB)を繋ぐアダプタ
import { DrizzleAdapter } from "@auth/drizzle-adapter";
//
// db:     db/index.ts のDBクライアント
import { db } from "@/db";
//
// users, accounts, sessions: db/schema.ts で定義したテーブル
import { users, accounts, sessions } from "@/db/schema";

// ----------------------------------------------------------------------------
// TODO: NextAuth(...) を呼び出して設定する
// ----------------------------------------------------------------------------
const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!clientId) {
    throw new Error("GOOGLE_CLIENT_IDが設定されていません");
}
if (!clientSecret) {
    throw new Error("GOOGLE_CLIENT_SECRETが設定されていません");
}

export const { handlers, signIn, signOut, auth } = NextAuth({
    adapter: DrizzleAdapter(db, {
        usersTable: users,
        accountsTable: accounts,
        sessionsTable: sessions,
    }),
    providers: [
        Google({
            clientId: clientId,    
            clientSecret: clientSecret,
        }),
    ],
});
//
// ヒント: process.env.GOOGLE_CLIENT_ID の型は string | undefined のはず。
// これまで drizzle.config.ts や db/index.ts で使った「undefinedだったら
// エラーを投げる」パターンを思い出して、同じように対処してみてください。

