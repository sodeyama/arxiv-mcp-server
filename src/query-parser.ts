import { ParsedQuery } from './types.js';

export class QueryParser {
  /**
   * Parse natural language query into structured search parameters
   */
  public parseQuery(naturalLanguageQuery: string): ParsedQuery {
    const query = naturalLanguageQuery.toLowerCase();
    const parsed: ParsedQuery = {
      searchTerms: [],
      authors: [],
      categories: [],
    };

    // Extract author names (patterns like "by author", "from author", "author:")
    const authorPatterns = [
      /(?:by|from|author:?)\s+([a-zA-Z\s,]+?)(?:\s+(?:and|on|in|about|paper|research)|$)/gi,
      /papers?\s+by\s+([a-zA-Z\s,]+?)(?:\s+(?:and|on|in|about|paper|research)|$)/gi,
    ];

    for (const pattern of authorPatterns) {
      const matches = query.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          const authors = match[1]
            .split(/,|\sand\s/)
            .map(author => author.trim())
            .filter(author => author.length > 0);
          parsed.authors.push(...authors);
        }
      }
    }

    // Extract categories/subjects (English and Japanese)
    const categoryMap: { [key: string]: string } = {
      'machine learning': 'cs.LG',
      '機械学習': 'cs.LG',
      'artificial intelligence': 'cs.AI',
      '人工知能': 'cs.AI',
      'computer vision': 'cs.CV',
      'コンピュータビジョン': 'cs.CV',
      '画像認識': 'cs.CV',
      'natural language processing': 'cs.CL',
      '自然言語処理': 'cs.CL',
      'nlp': 'cs.CL',
      'deep learning': 'cs.LG',
      '深層学習': 'cs.LG',
      'ディープラーニング': 'cs.LG',
      'neural networks': 'cs.NE',
      'ニューラルネットワーク': 'cs.NE',
      '神経回路網': 'cs.NE',
      'physics': 'physics',
      '物理学': 'physics',
      '物理': 'physics',
      'mathematics': 'math',
      '数学': 'math',
      'quantum': 'quant-ph',
      '量子': 'quant-ph',
      '量子コンピューティング': 'quant-ph',
      '量子計算': 'quant-ph',
      'biology': 'q-bio',
      '生物学': 'q-bio',
      'chemistry': 'physics.chem-ph',
      '化学': 'physics.chem-ph',
      'astronomy': 'astro-ph',
      '天文学': 'astro-ph',
      'cryptography': 'cs.CR',
      '暗号': 'cs.CR',
      'robotics': 'cs.RO',
      'ロボティクス': 'cs.RO',
      'ロボット': 'cs.RO',
      'databases': 'cs.DB',
      'データベース': 'cs.DB',
      'algorithms': 'cs.DS',
      'アルゴリズム': 'cs.DS',
      'graphics': 'cs.GR',
      'グラフィックス': 'cs.GR',
      'hci': 'cs.HC',
      'human computer interaction': 'cs.HC',
      'ヒューマンコンピュータインタラクション': 'cs.HC',
      'information theory': 'cs.IT',
      '情報理論': 'cs.IT',
      'networking': 'cs.NI',
      'ネットワーク': 'cs.NI',
      'operating systems': 'cs.OS',
      'オペレーティングシステム': 'cs.OS',
      'programming languages': 'cs.PL',
      'プログラミング言語': 'cs.PL',
      'software engineering': 'cs.SE',
      'ソフトウェア工学': 'cs.SE',
      'systems': 'cs.SY',
      'システム': 'cs.SY',
    };

    for (const [keyword, category] of Object.entries(categoryMap)) {
      if (query.includes(keyword)) {
        parsed.categories.push(category);
      }
    }

    // Extract date ranges (English and Japanese)
    const yearPattern = /(?:from|since|after|in|year|から|以降|年)\s*(\d{4})/gi;
    const yearMatches = [...query.matchAll(yearPattern)];
    if (yearMatches.length > 0) {
      const year = yearMatches[0][1];
      parsed.dateRange = { start: `${year}-01-01` };
    }

    const recentPattern = /(?:recent|latest|new|current|past\s+(?:year|month|week)|最新|最近|新しい|現在|今年|去年)/gi;
    if (recentPattern.test(query)) {
      const lastYear = new Date();
      lastYear.setFullYear(lastYear.getFullYear() - 1);
      parsed.dateRange = { start: lastYear.toISOString().split('T')[0] };
    }

    // Extract number of results
    const limitPattern = /(?:top|first|show|find|get)\s+(\d+)/gi;
    const limitMatch = limitPattern.exec(query);
    if (limitMatch) {
      parsed.maxResults = parseInt(limitMatch[1], 10);
    }

    // Extract main search terms (remove processed parts)
    let cleanQuery = query;
    
    // Remove author references
    for (const pattern of authorPatterns) {
      cleanQuery = cleanQuery.replace(pattern, '');
    }
    
    // Remove category keywords
    for (const keyword of Object.keys(categoryMap)) {
      cleanQuery = cleanQuery.replace(new RegExp(`\\b${keyword}\\b`, 'gi'), '');
    }
    
    // Remove date references
    cleanQuery = cleanQuery.replace(/(?:from|since|after|in|year)\s+\d{4}/gi, '');
    cleanQuery = cleanQuery.replace(/(?:recent|latest|new|current|past\s+(?:year|month|week))/gi, '');
    
    // Remove limit references
    cleanQuery = cleanQuery.replace(/(?:top|first|show|find|get)\s+\d+/gi, '');
    
    // Remove common stop words and extract meaningful terms (English and Japanese)
    const stopWords = new Set([
      'papers', 'paper', 'research', 'about', 'on', 'in', 'the', 'a', 'an', 
      'and', 'or', 'but', 'for', 'with', 'to', 'of', 'at', 'by', 'from',
      'find', 'search', 'look', 'get', 'show', 'give', 'me', 'i', 'want',
      'need', 'related', 'regarding', 'concerning', 'involving',
      '論文', '研究', 'について', 'に関する', 'の', 'が', 'を', 'で', 'は', 'も',
      '探す', '検索', '見つける', '取得', '表示', '欲しい', '必要', '関連', 'する'
    ]);

    const searchTerms = cleanQuery
      .split(/\s+/)
      .map(term => term.replace(/[^\w]/g, ''))
      .filter(term => term.length > 2 && !stopWords.has(term))
      .filter(term => term.length > 0);

    parsed.searchTerms = [...new Set(searchTerms)]; // Remove duplicates

    return parsed;
  }

  /**
   * Convert parsed query to arXiv search string
   */
  public buildArxivQuery(parsed: ParsedQuery): string {
    const queryParts: string[] = [];

    // Add search terms
    if (parsed.searchTerms.length > 0) {
      const termsQuery = parsed.searchTerms.join(' AND ');
      queryParts.push(`all:${termsQuery}`);
    }

    // Add authors
    if (parsed.authors.length > 0) {
      const authorsQuery = parsed.authors.map(author => `au:"${author}"`).join(' OR ');
      queryParts.push(`(${authorsQuery})`);
    }

    // Add categories
    if (parsed.categories.length > 0) {
      const categoriesQuery = parsed.categories.map(cat => `cat:${cat}`).join(' OR ');
      queryParts.push(`(${categoriesQuery})`);
    }

    // If no specific query parts, use search terms as general search
    if (queryParts.length === 0 && parsed.searchTerms.length === 0) {
      return 'all:*'; // Return all papers (with limits)
    }

    return queryParts.join(' AND ') || parsed.searchTerms.join(' ');
  }
}
