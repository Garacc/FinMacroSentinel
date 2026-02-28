/**
 * News tag types for multi-dimensional classification
 * Each news item can have multiple tags across different dimensions
 */

// Primary theme tags
export type PrimaryTag =
  | 'macro'       // 宏观经济 (CPI, GDP, 利率, 央行政策)
  | 'asset'       // 大类资产 (股, 债, 商品, 外汇)
  | 'industry'    // 行业板块 (科技, 医药, 消费, 能源)
  | 'geopolitics' // 地缘政治 (战争, 制裁, 贸易)
  | 'policy'      // 政策监管 (证监会, 央行, 财政部)
  | 'sentiment';  // 市场情绪 (VIX, 恐慌指数, 资金流向)

// Asset class tags
export type AssetTag =
  | 'bond'        // 债券/利率 (美债, 国债, 收益率)
  | 'stock'       // 股票/股指 (纳指, 标普, A股)
  | 'fx'          // 外汇 (美元, 人民币, 日元)
  | 'commodity'   // 大宗商品 (黄金, 原油, 铜)
  | 'crypto'      // 加密货币 (比特币, 以太坊)
  | 'reits';      // 房地产 (REITs, 地产板块)

// Geographic region tags
export type RegionTag =
  | 'us'          // 美国 (Fed, 非农, 美股)
  | 'china'       // 中国 (A股, 人民币, 宏观政策)
  | 'europe'      // 欧洲 (ECB, 欧元区)
  | 'japan'       // 日本 (央行, 日元)
  | 'emerging'    // 新兴市场
  | 'global';     // 全球性/多区域

// Time horizon tags
export type TimeTag =
  | 'short'       // 短期冲击 (< 1周)
  | 'medium'      // 中期趋势 (1周-3个月)
  | 'long';       // 长期逻辑 (> 3个月)

// Combined news tags
export interface NewsTags {
  primary: PrimaryTag[];
  asset: AssetTag[];
  region: RegionTag[];
  time: TimeTag[];
}

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
  tags?: NewsTags;  // Multi-dimensional tags
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
  sourceItems?: NewsItem[];  // Original news items with tags for display
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
