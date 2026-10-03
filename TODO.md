# TODO

## デプロイ後に対応が必要な項目（本番URLの追加）

まだ一度もデプロイしておらず本番ドメインが未確定のため、ローカル開発用の設定のみで進めている。
実際にVercelへデプロイし、本番URLが確定したタイミングで以下を追加する。

### Google OAuth（Google Cloud Console）

- [ ] 「承認済みのJavaScript生成元」に本番URLを追加（例: `https://<本番ドメイン>`）
- [ ] 「承認済みのリダイレクトURI」に本番URLを追加（例: `https://<本番ドメイン>/api/auth/callback/google`）
  - 現在登録済みなのは `http://localhost:3000` 関連のみ

### 楽天ウェブサービス（Rakuten Developers）

- [ ] 「許可されたWebサイト」に本番ドメインを追加
  - 現在は `localhost`（ローカル開発用）のみ登録予定
  - 楽天デベロッパーズの「アプリ情報の確認」画面から後で編集可能

### Vercel環境変数

- [ ] 楽天ブックスAPIのアプリID（取得後の名称は未定、例: `RAKUTEN_APPLICATION_ID`）をVercelの環境変数（production/preview）に追加
  - ローカルの`.env.local`には追加済み/追加予定だが、Vercel側は別途登録が必要
- [x] `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `AUTH_SECRET` はVercel側も設定済み
