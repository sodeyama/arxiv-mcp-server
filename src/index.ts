#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { ArxivAPI } from './arxiv-api.js';
import { QueryParser } from './query-parser.js';
import { ArxivSearchParams } from './types.js';

class ArxivMCPServer {
  private server: Server;
  private arxivAPI: ArxivAPI;
  private queryParser: QueryParser;

  constructor() {
    this.server = new Server(
      {
        name: 'arxiv-search-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.arxivAPI = new ArxivAPI();
    this.queryParser = new QueryParser();

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'search_arxiv_papers',
            description: 'Search for academic papers on arXiv using natural language queries. You can search by keywords, authors, categories, or date ranges.',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Natural language description of what papers to search for. Examples: "machine learning papers by Geoffrey Hinton", "recent deep learning research", "quantum computing papers from 2023"',
                },
                max_results: {
                  type: 'number',
                  description: 'Maximum number of papers to return (default: 10, max: 50)',
                  minimum: 1,
                  maximum: 50,
                  default: 10,
                },
                sort_by: {
                  type: 'string',
                  description: 'How to sort the results',
                  enum: ['relevance', 'lastUpdatedDate', 'submittedDate'],
                  default: 'relevance',
                },
                sort_order: {
                  type: 'string',
                  description: 'Sort order for results',
                  enum: ['ascending', 'descending'],
                  default: 'descending',
                },
              },
              required: ['query'],
            },
          },
          {
            name: 'get_arxiv_paper',
            description: 'Get detailed information about a specific arXiv paper by its ID',
            inputSchema: {
              type: 'object',
              properties: {
                arxiv_id: {
                  type: 'string',
                  description: 'The arXiv ID of the paper (e.g., "1706.03762", "2301.07041")',
                },
              },
              required: ['arxiv_id'],
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'search_arxiv_papers':
            return await this.handleSearchPapers(args);
          case 'get_arxiv_paper':
            return await this.handleGetPaper(args);
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        
        throw new McpError(
          ErrorCode.InternalError,
          `Failed to execute tool ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    });
  }

  private async handleSearchPapers(args: any) {
    const { query, max_results = 10, sort_by = 'relevance', sort_order = 'descending' } = args;

    if (!query || typeof query !== 'string') {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Query parameter is required and must be a string'
      );
    }

    if (max_results < 1 || max_results > 50) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'max_results must be between 1 and 50'
      );
    }

    // Parse the natural language query
    const parsed = this.queryParser.parseQuery(query);

    // Build arXiv query string
    const arxivQuery = this.queryParser.buildArxivQuery(parsed);

    // Prepare search parameters
    const searchParams: ArxivSearchParams = {
      query: arxivQuery,
      maxResults: parsed.maxResults || max_results,
      sortBy: sort_by as 'relevance' | 'lastUpdatedDate' | 'submittedDate',
      sortOrder: sort_order as 'ascending' | 'descending',
    };

    // Search arXiv
    const results = await this.arxivAPI.searchPapers(searchParams);

    if (results.papers.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `No papers found for query: "${query}"\n\nTry:\n- Using different keywords\n- Broadening your search terms\n- Checking spelling\n- Using author names or arXiv categories`,
          },
        ],
      };
    }

    // Format results
    const formattedResults = results.papers.map((paper, index) => {
      const authorsText = paper.authors.length > 0 ? paper.authors.join(', ') : 'Unknown authors';
      const categoriesText = paper.categories.length > 0 ? paper.categories.join(', ') : 'No categories';
      
      return `${index + 1}. **${paper.title}**
   - **Authors:** ${authorsText}
   - **arXiv ID:** ${paper.id}
   - **Published:** ${paper.publishedDate.split('T')[0]}
   - **Categories:** ${categoriesText}
   - **Abstract:** ${paper.abstract.length > 300 ? paper.abstract.substring(0, 300) + '...' : paper.abstract}
   - **PDF:** ${paper.pdfUrl}
   - **arXiv URL:** ${paper.arxivUrl}`;
    }).join('\n\n');

    const summary = `Found ${results.papers.length} papers (out of ${results.totalResults} total results) for query: "${query}"`;

    return {
      content: [
        {
          type: 'text',
          text: `${summary}\n\n${formattedResults}`,
        },
      ],
    };
  }

  private async handleGetPaper(args: any) {
    const { arxiv_id } = args;

    if (!arxiv_id || typeof arxiv_id !== 'string') {
      throw new McpError(
        ErrorCode.InvalidParams,
        'arxiv_id parameter is required and must be a string'
      );
    }



    const paper = await this.arxivAPI.getPaperById(arxiv_id);

    if (!paper) {
      return {
        content: [
          {
            type: 'text',
            text: `Paper with arXiv ID "${arxiv_id}" not found. Please check the ID and try again.`,
          },
        ],
      };
    }

    const authorsText = paper.authors.length > 0 ? paper.authors.join(', ') : 'Unknown authors';
    const categoriesText = paper.categories.length > 0 ? paper.categories.join(', ') : 'No categories';

    const paperInfo = `**${paper.title}**

**Authors:** ${authorsText}

**arXiv ID:** ${paper.id}

**Published:** ${paper.publishedDate.split('T')[0]}
**Last Updated:** ${paper.updatedDate.split('T')[0]}

**Categories:** ${categoriesText}

**Abstract:**
${paper.abstract}

**Links:**
- **PDF:** ${paper.pdfUrl}
- **arXiv Page:** ${paper.arxivUrl}`;

    return {
      content: [
        {
          type: 'text',
          text: paperInfo,
        },
      ],
    };
  }

  private setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      console.log('\nShutting down arXiv MCP server...');
      await this.server.close();
      process.exit(0);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}

// Start the server
const server = new ArxivMCPServer();
server.run().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
