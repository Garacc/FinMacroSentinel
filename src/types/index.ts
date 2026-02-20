/**
 * Type definitions for FinMacroSentinel
 */

/**
 * News categories for classification
 */
export enum NewsCategory {
  MACRO_FINANCE = 'macro_finance',    // 宏观金融与大类资产
  INDUSTRY = 'industry',              // 行业中观
  GEOPOLITICS = 'geopolitics',       // 地缘政治
}

/**
 * Data source types (mirrors config/dataSources.ts)
 */
export enum DataSourceType {
  RSS = 'rss',           // RSS feed
  HTML = 'html',         // Web scraping
  API = 'api',           // REST API
  JSON = 'json',         // JSON API endpoint
}

/**
 * News item from a data source
 */
export interface NewsItem {
  title: string;
  content: string;
  url: string;
  source: string;
  category: NewsCategory;
  timestamp: Date;
  // New optional fields for enhanced data sources
  sourceId?: string;           // Reference to dataSources.ts ID
  language?: 'en' | 'zh';      // Language of the content
  isApiData?: boolean;          // True if from API source (FRED, Finnhub, etc.)
  apiMetadata?: {               // Metadata for API-sourced data
    seriesId?: string;          // For FRED data series
    dataType?: string;          // Type of data (e.g., 'macro', 'sentiment', 'crypto')
  };
}

/**
 * Raw news collection from all sources
 */
export interface RawNewsCollection {
  items: NewsItem[];
  collectedAt: Date;
  sourceCount: number;
}

/**
 * Investment analysis result
 */
export interface InvestmentAnalysis {
  category: NewsCategory;
  coreFacts: string[];
  investmentDeduction: {
    assetMapping: string;
    tradingLevel: '短期冲击' | '中期趋势拐点' | '长期配置逻辑';
    riskAndHedge: string;
  };
  sources: string[];
}

/**
 * Structured report for output
 */
export interface MacroReport {
  title: string;
  date: string;
  time: string;
  analyses: InvestmentAnalysis[];
  isSilent?: boolean;  // true if no significant news
  generatedAt: Date;
}

/**
 * Feishu message card structure
 */
export interface FeishuCard {
  config: {
    wide_screen_mode: boolean;
  };
  header: {
    title: {
      tag: 'plain_text';
      content: string;
    };
    template: 'blue' | 'green' | 'red' | 'yellow' | 'grey';
  };
  elements: Array<{
    tag: 'div';
    text: {
      tag: 'markdown';
      content: string;
    };
  }>;
}

/**
 * Analysis result from LLM
 */
export interface LLMAnalysisResult {
  content: string;
  isSilent: boolean;
  error?: string;
}

/**
 * Scheduled task definition
 */
export interface ScheduledTask {
  name: string;
  cronExpression: string;
  timezone: string;
  handler: () => Promise<void>;
}

/**
 * Storage file metadata
 */
export interface StorageMetadata {
  filename: string;
  path: string;
  createdAt: Date;
  size: number;
}
