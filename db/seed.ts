// ============================================================================
// 初期データ(シードデータ)を投入するスクリプト（自分で書く）
// ----------------------------------------------------------------------------
// 直接実行して使う想定（`npx tsx db/seed.ts` のような形。package.jsonに
// `db:seed` スクリプトとして登録しておくと `npm run db:seed` で呼べて便利）。
//
// 今回は「ジャンル」が固定マスタ(ユーザーが自由に追加できない一覧)という設計なので、
// 新しいジャンルを増やしたくなったら、この配列に追記してから再実行する運用になる。
// 対象データ: docs/requirements.md / docs/database-design.md で確定したジャンル一覧
//   1: 小説, 2: ビジネス, 3: 自己啓発, 4: 技術書, 5: エッセイ, 6: その他
// ============================================================================

import { db } from "./index";
import { genres } from "./schema";

const initialGenres = [
    { id: 1, name: "小説" },
    { id: 2, name: "ビジネス" },
    { id: 3, name: "自己啓発" },
    { id: 4, name: "技術書" },
    { id: 5, name: "エッセイ" },
    { id: 6, name: "その他" },
];

// onConflictDoNothing(): 同じidが既にあれば何もしない（何度実行しても安全）
async function main() {
    await db.insert(genres).values(initialGenres).onConflictDoNothing();
    console.log(`seeded ${initialGenres.length} genres`);
}

main()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err);
        process.exit(1);
    }); 

