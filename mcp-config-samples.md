# MCP Server 設定サンプル集

## Claude Desktop

### macOS
設定ファイル: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "arxiv-search": {
      "command": "node",
      "args": ["/absolute/path/to/arxiv-mcp-server/dist/index.js"],
      "env": {}
    }
  }
}
```

### Windows
設定ファイル: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "arxiv-search": {
      "command": "node",
      "args": ["C:\\absolute\\path\\to\\arxiv-mcp-server\\dist\\index.js"],
      "env": {}
    }
  }
}
```

### Linux
設定ファイル: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "arxiv-search": {
      "command": "node",
      "args": ["/absolute/path/to/arxiv-mcp-server/dist/index.js"],
      "env": {}
    }
  }
}
```

## Continue.dev

### config.json
```json
{
  "models": [],
  "customCommands": [],
  "contextProviders": [
    {
      "name": "arxiv-mcp",
      "params": {
        "serverPath": "/absolute/path/to/arxiv-mcp-server/dist/index.js"
      }
    }
  ]
}
```

## Cursor

### cursor-config.json
```json
{
  "mcp": {
    "servers": {
      "arxiv-search": {
        "command": "node",
        "args": ["/absolute/path/to/arxiv-mcp-server/dist/index.js"],
        "capabilities": ["tools"]
      }
    }
  }
}
```

## Visual Studio Code + MCP Extension

### settings.json
```json
{
  "mcp.servers": {
    "arxiv-search": {
      "command": "node",
      "args": ["/absolute/path/to/arxiv-mcp-server/dist/index.js"],
      "env": {}
    }
  }
}
```

## Docker環境での実行

### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

EXPOSE 3000
CMD ["node", "dist/index.js"]
```

### docker-compose.yml
```yaml
version: '3.8'
services:
  arxiv-mcp:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
```

## npm グローバルインストール後の設定

### インストール
```bash
npm install -g arxiv-mcp-server
```

### 設定（グローバルインストール後）
```json
{
  "mcpServers": {
    "arxiv-search": {
      "command": "arxiv-mcp-server",
      "args": [],
      "env": {}
    }
  }
}
```

## 環境変数での設定

### .env ファイル
```env
ARXIV_API_BASE_URL=http://export.arxiv.org/api/query
ARXIV_MAX_RESULTS=50
ARXIV_TIMEOUT=10000
```

### 環境変数を使用した設定
```json
{
  "mcpServers": {
    "arxiv-search": {
      "command": "node",
      "args": ["/absolute/path/to/arxiv-mcp-server/dist/index.js"],
      "env": {
        "ARXIV_MAX_RESULTS": "20",
        "ARXIV_TIMEOUT": "15000"
      }
    }
  }
}
```

## PM2での常駐起動

### ecosystem.config.js
```javascript
module.exports = {
  apps: [{
    name: 'arxiv-mcp-server',
    script: './dist/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
```

### 起動コマンド
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 複数MCPサーバーの設定例

```json
{
  "mcpServers": {
    "arxiv-search": {
      "command": "node",
      "args": ["/path/to/arxiv-mcp-server/dist/index.js"],
      "env": {}
    },
    "web-search": {
      "command": "node",
      "args": ["/path/to/web-search-mcp/dist/index.js"],
      "env": {}
    },
    "file-manager": {
      "command": "python",
      "args": ["/path/to/file-mcp/main.py"],
      "env": {}
    }
  }
}
```

## デバッグ設定

### 詳細ログ有効化
```json
{
  "mcpServers": {
    "arxiv-search": {
      "command": "node",
      "args": ["/absolute/path/to/arxiv-mcp-server/dist/index.js"],
      "env": {
        "DEBUG": "*",
        "NODE_ENV": "development"
      }
    }
  }
}
```

## 設定確認コマンド

### パスの確認
```bash
# プロジェクトディレクトリで実行
pwd && echo "/dist/index.js"
```

### 動作テスト
```bash
# MCPサーバー単体テスト
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}' | node dist/index.js

# 接続テスト
echo '{"jsonrpc": "2.0", "id": 2, "method": "tools/call", "params": {"name": "search_arxiv_papers", "arguments": {"query": "test", "max_results": 1}}}' | node dist/index.js
```