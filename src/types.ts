export interface ArxivPaper {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  publishedDate: string;
  updatedDate: string;
  categories: string[];
  pdfUrl: string;
  arxivUrl: string;
}

export interface ArxivSearchParams {
  query: string;
  maxResults?: number;
  startIndex?: number;
  sortBy?: 'relevance' | 'lastUpdatedDate' | 'submittedDate';
  sortOrder?: 'ascending' | 'descending';
}

export interface SearchResult {
  papers: ArxivPaper[];
  totalResults: number;
  startIndex: number;
  itemsPerPage: number;
}

export interface ParsedQuery {
  searchTerms: string[];
  authors: string[];
  categories: string[];
  dateRange?: {
    start?: string;
    end?: string;
  };
  maxResults?: number;
}
