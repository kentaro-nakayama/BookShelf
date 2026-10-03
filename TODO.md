# TODO

## デプロイ後に対応が必要な項目（本番URLの追加）

本番ドメインが確定（`https://bookshelf-app-peach.vercel.app`、GitHub連携による自動デプロイ済み）したため、以下は対応済み。

### Google OAuth（Google Cloud Console）

- [x] 「承認済みのJavaScript生成元」に本番URLを追加（`https://bookshelf-app-peach.vercel.app`）
- [x] 「承認済みのリダイレクトURI」に本番URLを追加（`https://bookshelf-app-peach.vercel.app/api/auth/callback/google`）
  - `http://localhost:3000` 関連も残したまま併用
  - 本番URLでのGoogleログイン動作確認済み（2026-10-03）

### 楽天ウェブサービス（Rakuten Developers）

- [x] アプリ登録完了、「許可されたWebサイト」に本番ドメイン（`bookshelf-app-peach.vercel.app`）を追加済み
  - `127.0.0.1`（ローカル開発用）も登録済み
  - アプリID取得済み（`RAKUTEN_APPLICATION_ID`として`.env.local`に追加済み）

### Vercel環境変数

- [x] 楽天ブックスAPIのアプリID（`RAKUTEN_APPLICATION_ID`）をVercelの環境変数（production/preview/development）に追加済み
- [x] `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `AUTH_SECRET` はVercel側も設定済み（2026-10-03にローテーション済み）

## セキュリティインシデント記録（2026-10-03）

- `.env.local`の中身を確認する際にClaudeが`Read`ツールを誤って使用し、会話ログに全ての秘密情報（DBパスワード、AUTH_SECRET、Googleクライアントシークレット等）が平文で表示される事故が発生
- 対応: Neon DBパスワード、AUTH_SECRET、GOOGLE_CLIENT_SECRETを全てローテーション済み、動作確認済み
- 教訓: 環境変数ファイルの中身を確認する際は、必ず`grep`等で値を伏せた方法を使う（`cat`や`Read`で直接開かない）
