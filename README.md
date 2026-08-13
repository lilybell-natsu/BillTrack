# BillTrack

契約書・重要書類、保証書+取扱説明書、公共料金の推移をまとめて管理するPWA(Progressive Web App)です。
スマートフォンでの利用を第一に考えて設計しています。

## 主な機能

- **契約書・重要書類の保管**: 写真/PDFで保存し、更新日が近づくとホーム画面で警告表示
- **保証書+取扱説明書の管理**: 製品ごとに保証書と取扱説明書(複数ファイル)をまとめて保存。保証期限が近い順に一覧表示
- **公共料金の推移トラッカー**: 電気・ガス・水道を種別ごとに記録し、月次グラフと先月比を表示
- データはすべて端末内のブラウザ(IndexedDB)に保存され、外部サーバーには送信されません

## 技術構成

- Vanilla HTML / CSS / JavaScript(フレームワーク不使用)
- データ永続化: IndexedDB(写真・PDFなどのファイルも保存可能)
- PWA: `manifest.json` + Service Worker によるオフライン対応・ホーム画面追加対応

## GitHub Pagesで公開する手順

1. GitHubで新しいリポジトリを作成する(例: `billtrack`)
2. このフォルダの中身一式をリポジトリにpushする
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<あなたのユーザー名>/billtrack.git
   git push -u origin main
   ```
3. GitHubのリポジトリページで **Settings → Pages** を開く
4. "Build and deployment" の Source を **Deploy from a branch** にし、Branch を `main` / `/(root)` に設定して保存
5. 数分後に `https://<あなたのユーザー名>.github.io/billtrack/` で公開されます
6. iPhoneのSafariでそのURLを開き、共有ボタン → 「ホーム画面に追加」を選ぶとアプリのように使えます

## ローカルでの動作確認

Service WorkerやIndexedDBはローカルファイル(`file://`)では正しく動かないため、簡易サーバーを立てて確認してください。

```bash
cd billtrack
python3 -m http.server 8000
```

ブラウザで `http://localhost:8000` を開いて確認できます。

## 今後の拡張候補

- Push通知による期限リマインド(現状はアプリを開いた時のみ警告表示)
- 書類名・製品名でのキーワード検索
- データのインポート(現状はJSONエクスポートのみ対応)
