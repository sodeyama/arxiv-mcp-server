import axios from 'axios';
import { parseString } from 'xml2js';
import { promisify } from 'util';
import { ArxivPaper, ArxivSearchParams, SearchResult } from './types.js';

const parseXml = promisify(parseString);

export class ArxivAPI {
  private readonly baseUrl = 'http://export.arxiv.org/api/query';
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // 1 second

  /**
   * Search arXiv for papers
   */
  public async searchPapers(params: ArxivSearchParams): Promise<SearchResult> {
    const searchParams = new URLSearchParams({
      search_query: params.query,
      start: (params.startIndex || 0).toString(),
      max_results: (params.maxResults || 10).toString(),
    });

    if (params.sortBy) {
      searchParams.set('sortBy', params.sortBy);
    }
    if (params.sortOrder) {
      searchParams.set('sortOrder', params.sortOrder);
    }

    const url = `${this.baseUrl}?${searchParams.toString()}`;

    try {
      const response = await this.makeRequestWithRetry(url);
      const xmlData = response.data;
      
      const result = await this.parseArxivResponse(xmlData);
      return result;
    } catch (error) {
      throw new Error(`Failed to search arXiv: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Make HTTP request with retry logic
   */
  private async makeRequestWithRetry(url: string, retries = 0): Promise<any> {
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'ArxivMCPServer/1.0',
        },
      });
      return response;
    } catch (error) {
      if (retries < this.maxRetries) {
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.makeRequestWithRetry(url, retries + 1);
      }
      throw error;
    }
  }

  /**
   * Parse arXiv XML response
   */
  private async parseArxivResponse(xmlData: string): Promise<SearchResult> {
    try {
      const parsed: any = await parseXml(xmlData);
      const feed = parsed.feed;

      if (!feed) {
        throw new Error('Invalid XML response from arXiv');
      }

      // Extract metadata
      const totalResults = parseInt(feed['opensearch:totalResults']?.[0] || '0', 10);
      const startIndex = parseInt(feed['opensearch:startIndex']?.[0] || '0', 10);
      const itemsPerPage = parseInt(feed['opensearch:itemsPerPage']?.[0] || '0', 10);

      // Parse entries
      const entries = feed.entry || [];
      const papers: ArxivPaper[] = entries.map((entry: any) => this.parseEntry(entry));

      return {
        papers,
        totalResults,
        startIndex,
        itemsPerPage,
      };
    } catch (error) {
      throw new Error(`Failed to parse arXiv response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse individual paper entry
   */
  private parseEntry(entry: any): ArxivPaper {
    // Extract ID from the entry id (format: http://arxiv.org/abs/1234.5678v1)
    const idMatch = entry.id?.[0]?.match(/abs\/(.+?)(?:v\d+)?$/);
    const arxivId = idMatch ? idMatch[1] : entry.id?.[0] || '';

    // Extract title
    const title = entry.title?.[0]?.replace(/\s+/g, ' ').trim() || 'No title';

    // Extract authors
    const authors = entry.author ? entry.author.map((author: any) => author.name?.[0] || '').filter(Boolean) : [];

    // Extract abstract
    const abstract = entry.summary?.[0]?.replace(/\s+/g, ' ').trim() || 'No abstract available';

    // Extract dates
    const publishedDate = entry.published?.[0] || '';
    const updatedDate = entry.updated?.[0] || publishedDate;

    // Extract categories
    const categories = entry.category ? entry.category.map((cat: any) => cat.$.term || '').filter(Boolean) : [];

    // Build URLs
    const pdfUrl = entry.link?.find((link: any) => link.$.type === 'application/pdf')?.$.href || 
                   `http://arxiv.org/pdf/${arxivId}.pdf`;
    const arxivUrl = entry.link?.find((link: any) => link.$.type === 'text/html')?.$.href || 
                     `http://arxiv.org/abs/${arxivId}`;

    return {
      id: arxivId,
      title,
      authors,
      abstract,
      publishedDate,
      updatedDate,
      categories,
      pdfUrl,
      arxivUrl,
    };
  }

  /**
   * Get paper by arXiv ID
   */
  public async getPaperById(arxivId: string): Promise<ArxivPaper | null> {
    try {
      const result = await this.searchPapers({
        query: `id:${arxivId}`,
        maxResults: 1,
      });

      return result.papers.length > 0 ? result.papers[0] : null;
    } catch (error) {
      throw new Error(`Failed to fetch paper ${arxivId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
