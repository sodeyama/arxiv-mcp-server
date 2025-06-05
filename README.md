# arXiv Search MCP Server

A Model Context Protocol (MCP) server that enables natural language searching of arXiv academic papers. Built with Node.js and TypeScript for local execution.

## Features

- **Natural Language Queries**: Search for papers using conversational language (English and Japanese)
- **Comprehensive Search**: Search by keywords, authors, categories, and date ranges
- **Structured Results**: Get detailed paper information including titles, authors, abstracts, and links
- **MCP Protocol Compliance**: Works with Claude Desktop and other MCP-compatible clients
- **Error Handling**: Robust error handling and retry logic for API calls
- **Real-time Data**: Fetches live data from arXiv API

## Quick Start

1. **Clone and Setup**
   ```bash
   git clone https://github.com/sodeyama/arxiv-mcp-server.git
   cd arxiv-mcp-server
   npm install
   npm run build
   ```

2. **Configure Claude Desktop**
   
   Add to your Claude Desktop config file:
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

3. **Usage Examples**
   - "最新の深層学習研究を5件見つけて"
   - "Geoffrey Hintonの機械学習論文"  
   - "量子コンピューティングに関する2023年以降の研究"
   - "RAG retrieval augmented generation"

## Configuration Files

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`  
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

## Available Tools

### search_arxiv_papers
Search for academic papers using natural language queries.

**Parameters:**
- `query` (string, required): Natural language search query
- `max_results` (number, optional): Maximum papers to return (1-50, default: 10)
- `sort_by` (string, optional): Sort by relevance, lastUpdatedDate, or submittedDate
- `sort_order` (string, optional): ascending or descending

### get_arxiv_paper  
Get detailed information about a specific paper by arXiv ID.

**Parameters:**
- `arxiv_id` (string, required): The arXiv ID (e.g., "2212.13345")

## Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   