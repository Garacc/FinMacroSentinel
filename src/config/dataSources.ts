/**
 * Data source configuration for FinMacroSentinel
 * Centralizes all data source URLs and types
 */

import { NewsCategory } from '../types';

/**
 * Data source types
 */
export enum DataSourceType {
  RSS = 'rss',           // RSS feed
  HTML = 'html',         // Web scraping
  API = 'api',           // REST API
  JSON = 'json',         // JSON API endpoint
}

/**
 * Language classification for source
 */
export enum SourceLanguage {
  EN = 'en',     // English
  ZH = 'zh',     // Chinese
  MIXED = 'mixed',
}

/**
 * Data source configuration interface
 */
export interface DataSource {
  id: string;
  name: string;
  nameCn: string;
  url: string;
  type: DataSourceType;
  category: NewsCategory;
  language: SourceLanguage;
  enabled: boolean;
  priority: number;      // 1 = highest priority
  requiresAuth: boolean;  // Whether API key is required
  authEnvVar?: string;    // Environment variable name for API key
  // For API sources, optional fields
  apiEndpoint?: string;
  apiParams?: Record<string, string>;
}

/**
 * FRED API series IDs for US macro data
 */
export const FRED_SERIES = {
  // Real GDP
  GDPC1: 'GDPC1',           // Real Gross Domestic Product
  // Inflation
  CPIAUCSL: 'CPIAUCSL',     // Consumer Price Index for All Urban Consumers
  PCEPI: 'PCEPI',           // Personal Consumption Expenditures Price Index
  // Employment
  UNRATE: 'UNRATE',         // Unemployment Rate
  PAYEMS: 'PAYEMS',         // Total Nonfarm Payrolls
  // Interest Rates
  FEDFUNDS: 'FEDFUNDS',     // Federal Funds Rate
  DGS10: 'DGS10',           // 10-Year Treasury Constant Maturity Rate
  DGS2: 'DGS2',             // 2-Year Treasury Constant Maturity Rate
  // Trade
  BOPGSTB: 'BOPGSTB',       // Trade Balance
  // Retail
  RSFSXMV: 'RSFSXMV',       // Retail Sales
  // Housing
  HOUST: 'HOUST',           // Housing Starts
  // Consumer
  UMCSENT: 'UMCSENT',       // University of Michigan Consumer Sentiment
  // Money Supply
  M2SL: 'M2SL',             // M2 Money Stock
};

/**
 * All data sources - including existing and new sources
 */
export const DATA_SOURCES: DataSource[] = [
  // ==================== RSS Feeds (保留) ====================
  // English RSS - High Priority
  {
    id: 'marketwatch_rss',
    name: 'MarketWatch RSS',
    nameCn: 'MarketWatch',
    url: 'https://feeds.marketwatch.com/marketwatch/topstories/',
    type: DataSourceType.RSS,
    category: NewsCategory.MACRO_FINANCE,
    language: SourceLanguage.EN,
    enabled: true,
    priority: 1,
    requiresAuth: false,
  },
  {
    id: 'cnbc_rss',
    name: 'CNBC RSS',
    nameCn: 'CNBC',
    url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html',
    type: DataSourceType.RSS,
    category: NewsCategory.MACRO_FINANCE,
    language: SourceLanguage.EN,
    enabled: true,
    priority: 1,
    requiresAuth: false,
  },
  {
    id: 'cnn_business_rss',
    name: 'CNN Business RSS',
    nameCn: 'CNN财经',
    url: 'http://rss.cnn.com/rss/money_topstories.rss',
    type: DataSourceType.RSS,
    category: NewsCategory.MACRO_FINANCE,
    language: SourceLanguage.EN,
    enabled: true,
    priority: 2,
    requiresAuth: false,
  },
  {
    id: 'bbc_business_rss',
    name: 'BBC Business RSS',
    nameCn: 'BBC财经',
    url: 'https://feeds.bbci.co.uk/news/business/rss.xml',
    type: DataSourceType.RSS,
    category: NewsCategory.MACRO_FINANCE,
    language: SourceLanguage.EN,
    enabled: true,
    priority: 2,
    requiresAuth: false,
  },

  // ==================== New RSS Feeds (新增) ====================
  {
    id: 'wsj_rss',
    name: 'WSJ RSS',
    nameCn: '华尔街日报',
    url: 'https://feeds.a.dj.com/rss/RSSMarketsMain.xml',
    type: DataSourceType.RSS,
    category: NewsCategory.MACRO_FINANCE,
    language: SourceLanguage.EN,
    enabled: true,
    priority: 1,
    requiresAuth: false,
  },
  {
    id: 'reuters_business_rss',
    name: 'Reuters Business RSS',
    nameCn: '路透财经',
    url: 'https://www.reuters.com/markets/rssfeed/',
    type: DataSourceType.RSS,
    category: NewsCategory.MACRO_FINANCE,
    language: SourceLanguage.EN,
    enabled: true,
    priority: 1,
    requiresAuth: false,
  },

  // ==================== Chinese Web Sources (保留) ====================
  {
    id: 'sina_macro',
    name: '新浪财经',
    nameCn: '新浪财经',
    url: 'https://finance.sina.com.cn/macro/',
    type: DataSourceType.HTML,
    category: NewsCategory.MACRO_FINANCE,
    language: SourceLanguage.ZH,
    enabled: true,
    priority: 3,
    requiresAuth: false,
  },
  {
    id: 'netease_money',
    name: '网易财经',
    nameCn: '网易财经',
    url: 'https://money.163.com/',
    type: DataSourceType.HTML,
    category: NewsCategory.MACRO_FINANCE,
    language: SourceLanguage.ZH,
    enabled: true,
    priority: 3,
    requiresAuth: false,
  },
  {
    id: 'wallstreetcn',
    name: '华尔街见闻',
    nameCn: '华尔街见闻',
    url: 'https://wallstreetcn.com/news/global',
    type: DataSourceType.HTML,
    category: NewsCategory.MACRO_FINANCE,
    language: SourceLanguage.ZH,
    enabled: true,
    priority: 3,
    requiresAuth: false,
  },
  {
    id: 'jin10',
    name: '金十数据',
    nameCn: '金十数据',
    url: 'https://www.jin10.com/',
    type: DataSourceType.HTML,
    category: NewsCategory.MACRO_FINANCE,
    language: SourceLanguage.ZH,
    enabled: true,
    priority: 3,
    requiresAuth: false,
  },
  {
    id: 'ifeng_finance',
    name: '凤凰网财经',
    nameCn: '凤凰网财经',
    url: 'https://finance.ifeng.com/c/80',
    type: DataSourceType.HTML,
    category: NewsCategory.MACRO_FINANCE,
    language: SourceLanguage.ZH,
    enabled: true,
    priority: 4,
    requiresAuth: false,
  },
  {
    id: 'tonghuashun',
    name: '同花顺',
    nameCn: '同花顺',
    url: 'https://www.10jqka.com.cn/',
    type: DataSourceType.HTML,
    category: NewsCategory.MACRO_FINANCE,
    language: SourceLanguage.ZH,
    enabled: true,
    priority: 4,
    requiresAuth: false,
  },

  // ==================== Industry Category Sources (保留) ====================
  {
    id: 'sina_stock',
    name: '新浪财经-股票',
    nameCn: '新浪股票',
    url: 'https://finance.sina.com.cn/stock/',
    type: DataSourceType.HTML,
    category: NewsCategory.INDUSTRY,
    language: SourceLanguage.ZH,
    enabled: true,
    priority: 5,
    requiresAuth: false,
  },
  {
    id: 'netease_stock',
    name: '网易财经-股票',
    nameCn: '网易股票',
    url: 'https://money.163.com/stock/',
    type: DataSourceType.HTML,
    category: NewsCategory.INDUSTRY,
    language: SourceLanguage.ZH,
    enabled: true,
    priority: 5,
    requiresAuth: false,
  },
  {
    id: 'tonghuashun_industry',
    name: '同花顺-行业',
    nameCn: '同花顺行业',
    url: 'https://www.10jqka.com.cn/stock/news/',
    type: DataSourceType.HTML,
    category: NewsCategory.INDUSTRY,
    language: SourceLanguage.ZH,
    enabled: true,
    priority: 5,
    requiresAuth: false,
  },
  {
    id: 'jin10_flash',
    name: '金十数据-快讯',
    nameCn: '金十快讯',
    url: 'https://www.jin10.com/',
    type: DataSourceType.HTML,
    category: NewsCategory.INDUSTRY,
    language: SourceLanguage.ZH,
    enabled: true,
    priority: 5,
    requiresAuth: false,
  },

  // ==================== Geopolitics Sources (保留) ====================
  {
    id: 'sina_world',
    name: '新浪新闻-国际',
    nameCn: '新浪国际',
    url: 'https://news.sina.com.cn/world/',
    type: DataSourceType.HTML,
    category: NewsCategory.GEOPOLITICS,
    language: SourceLanguage.ZH,
    enabled: true,
    priority: 5,
    requiresAuth: false,
  },
  {
    id: 'netease_world',
    name: '网易新闻-国际',
    nameCn: '网易国际',
    url: 'https://news.163.com/world/',
    type: DataSourceType.HTML,
    category: NewsCategory.GEOPOLITICS,
    language: SourceLanguage.ZH,
    enabled: true,
    priority: 5,
    requiresAuth: false,
  },
  {
    id: 'ifeng_world',
    name: '凤凰网-国际',
    nameCn: '凤凰国际',
    url: 'https://news.ifeng.com/world/',
    type: DataSourceType.HTML,
    category: NewsCategory.GEOPOLITICS,
    language: SourceLanguage.ZH,
    enabled: true,
    priority: 5,
    requiresAuth: false,
  },

  // ==================== API Data Sources (新增) ====================
  // FRED API - US Macro Data
  {
    id: 'fred_api',
    name: 'FRED API',
    nameCn: '美联储经济数据',
    url: 'https://api.stlouisfed.org/fred',
    type: DataSourceType.API,
    category: NewsCategory.MACRO_FINANCE,
    language: SourceLanguage.EN,
    enabled: true,
    priority: 1,
    requiresAuth: true,
    authEnvVar: 'FRED_API_KEY',
    apiEndpoint: 'https://api.stlouisfed.org/fred/series/observations',
    apiParams: {
      file_type: 'json',
    },
  },

  // VIX Index
  {
    id: 'vix_index',
    name: 'VIX Index',
    nameCn: 'VIX恐慌指数',
    url: 'https://www.cnbc.com/id/10000664/device/rss/rss.html',
    type: DataSourceType.RSS,
    category: NewsCategory.MACRO_FINANCE,
    language: SourceLanguage.EN,
    enabled: true,
    priority: 1,
    requiresAuth: false,
  },

  // Alternative VIX from CBOE
  {
    id: 'cboe_vix',
    name: 'CBOE VIX',
    nameCn: 'CBOE VIX',
    url: 'https://www.cnbc.com/id/10000664/device/rss/rss.html',
    type: DataSourceType.RSS,
    category: NewsCategory.MACRO_FINANCE,
    language: SourceLanguage.EN,
    enabled: true,
    priority: 2,
    requiresAuth: false,
  },

  // Fear & Greed Index
  {
    id: 'fear_greed',
    name: 'Fear & Greed Index',
    nameCn: '恐慌贪婪指数',
    url: 'https://alternative.me/crypto/fear-and-greed-index/',
    type: DataSourceType.HTML,
    category: NewsCategory.MACRO_FINANCE,
    language: SourceLanguage.EN,
    enabled: true,
    priority: 2,
    requiresAuth: false,
  },

  // Finnhub - US Stock News
  {
    id: 'finnhub_news',
    name: 'Finnhub API',
    nameCn: 'Finnhub美股新闻',
    url: 'https://finnhub.io/api/v1',
    type: DataSourceType.API,
    category: NewsCategory.MACRO_FINANCE,
    language: SourceLanguage.EN,
    enabled: true,
    priority: 2,
    requiresAuth: true,
    authEnvVar: 'FINNHUB_API_KEY',
    apiEndpoint: 'https://finnhub.io/api/v1/news',
    apiParams: {
      category: 'general',
    },
  },

  // Finnhub - Crypto News
  {
    id: 'finnhub_crypto',
    name: 'Finnhub Crypto',
    nameCn: 'Finnhub加密货币',
    url: 'https://finnhub.io/api/v1',
    type: DataSourceType.API,
    category: NewsCategory.MACRO_FINANCE,
    language: SourceLanguage.EN,
    enabled: true,
    priority: 3,
    requiresAuth: true,
    authEnvVar: 'FINNHUB_API_KEY',
    apiEndpoint: 'https://finnhub.io/api/v1/news',
    apiParams: {
      category: 'cryptocurrency',
    },
  },
];

/**
 * Get enabled data sources
 */
export function getEnabledSources(): DataSource[] {
  return DATA_SOURCES.filter(s => s.enabled);
}

/**
 * Get sources by category
 */
export function getSourcesByCategory(category: NewsCategory): DataSource[] {
  return getEnabledSources().filter(s => s.category === category);
}

/**
 * Get sources by type
 */
export function getSourcesByType(type: DataSourceType): DataSource[] {
  return getEnabledSources().filter(s => s.type === type);
}

/**
 * Get sources by language
 */
export function getSourcesByLanguage(language: SourceLanguage): DataSource[] {
  return getEnabledSources().filter(s => s.language === language);
}

/**
 * Get API sources that require authentication
 */
export function getAuthRequiredSources(): DataSource[] {
  return getEnabledSources().filter(s => s.requiresAuth);
}

/**
 * Get high priority sources
 */
export function getHighPrioritySources(maxPriority: number = 2): DataSource[] {
  return getEnabledSources().filter(s => s.priority <= maxPriority);
}

/**
 * Get source by ID
 */
export function getSourceById(id: string): DataSource | undefined {
  return DATA_SOURCES.find(s => s.id === id);
}

/**
 * Get all unique source names
 */
export function getAllSourceNames(): string[] {
  return [...new Set(DATA_SOURCES.map(s => s.name))];
}
