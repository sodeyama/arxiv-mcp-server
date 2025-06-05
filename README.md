# arXiv Search MCP Server

A Model Context Protocol (MCP) server that enables natural language searching of arXiv academic papers. Built with Node.js and TypeScript for local macOS execution.

## Features

- **Natural Language Queries**: Search for papers using conversational language
- **Comprehensive Search**: Search by keywords, authors, categories, and date ranges
- **Structured Results**: Get detailed paper information including titles, authors, abstracts, and links
- **MCP Protocol Compliance**: Works with any MCP-compatible client
- **Error Handling**: Robust error handling and retry logic for API calls

## Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install @modelcontextprotocol/sdk axios xml2js
   npm install -D typescript @types/node @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint ts-node
   ```

3. Build the project:
   ```bash
   npx tsc
   