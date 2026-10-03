// ============================================================================
// Referer/Originヘッダー付きでJSONを取得する共通関数
// ----------------------------------------------------------------------------
// 楽天ブックスAPI・Google Books API(ウェブサイト制限ありのAPIキー)の両方で、
// 「サーバーからの呼び出しでも、登録したサイトと一致するReferer/Originヘッダーを
// 手動で付けないと拒否される」という同じ制約に当たったため、共通処理として
// 切り出した。
//
// 標準の fetch() ではこれができない点に注意: fetch()の第2引数(headers)で
// "Referer"を指定しても、ブラウザの仕様上「禁止ヘッダー」として無視されてしまう
// （実際に試して確認済み）。そのため、Node.js組み込みの https モジュールを
// 直接使って、低レベルにリクエストを送っている。
// ============================================================================

import https from "node:https";

export function fetchJsonWithReferer(
    url: URL,
    referer: string,
): Promise<{ status: number; data: unknown }> {
    return new Promise((resolve, reject) => {
        https
            .get(
                {
                    hostname: url.hostname,
                    path: url.pathname + url.search,
                    headers: {
                        Referer: referer,
                        Origin: referer,
                    },
                },
                (res) => {
                    let body = "";
                    res.on("data", (chunk) => (body += chunk));
                    res.on("end", () => {
                        try {
                            resolve({
                                status: res.statusCode ?? 0,
                                data: JSON.parse(body),
                            });
                        } catch (err) {
                            reject(err);
                        }
                    });
                },
            )
            .on("error", reject);
    });
}

// Rakuten Developers / Google Cloud Console の両方の「許可されたサイト」に
// 登録してある、本番ドメイン。ローカル開発でもこの値をそのまま使ってよい
// （実際にアプリが動いているURLと一致している必要はなく、登録した値と
// 一致してさえいればRefererチェックを通過できるため）。
export const SITE_REFERER = "https://bookshelf-app-peach.vercel.app/";
