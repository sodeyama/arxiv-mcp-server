# arXiv MCP Server セットアップガイド

## インストール手順

### 1. リポジトリのクローン
```bash
git clone https://github.com/sodeyama/arxiv-mcp-server.git
cd arxiv-mcp-server
```

### 2. 依存関係のインストール
```bash
npm install
```

### 3. プロジェクトのビルド
```bash
npm run build
```

## Claude Desktop での設定

### macOS の場合
Claude Desktop設定ファイルの場所:
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

### 設定内容
以下の内容を `claude_desktop_config.json` に追加:

```json
{
  "mcpServers": {
    "arxiv-search": {
      "command": "node",
      "args": ["/Users/あなたのユーザー名/path/to/arxiv-mcp-server/dist/index.js"],
      "env": {}
    }
  }
}
```

**重要**: `/Users/あなたのユーザー名/path/to/arxiv-mcp-server/dist/index.js` を実際のパスに変更してください。

### パスの確認方法
プロジェクトディレクトリで以下を実行:
```bash
pwd
```
出力されたパスに `/dist/index.js` を追加したものを設定ファイルに記入してください。

## 使用例

### 基本的な検索
- "機械学習の最新論文を5件見つけて"
- "Geoffrey Hintonの深層学習論文"
- "量子コンピューティングに関する研究"

### 詳細検索
- "2023年以降のコンピュータビジョン論文"
- "自然言語処理の最近の研究動向"

### 論文詳細取得
- 特定のarXiv ID（例: "2212.13345"）で論文の詳細情報を取得

## トラブルシューティング

### 設定ファイルが見つからない場合
Claude Desktopを一度起動してから終了すると、設定ファイルが自動作成されます。

### パスエラーの場合
- dist/index.js ファイルが存在することを確認
- 絶対パスを使用していることを確認
- Node.js がインストールされていることを確認

### 権限エラーの場合
```bash
chmod +x dist/index.js
```

## 動作確認

### コマンドラインでのテスト
```bash
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}' | node dist/index.js
```

正常に動作している場合、利用可能なツールのリストが JSON 形式で出力されます。