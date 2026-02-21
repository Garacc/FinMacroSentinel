/**
 * Shared constants for FinMacroSentinel
 * Contains keywords and configuration shared across modules
 */

import { NewsCategory } from './types';

/**
 * Category keywords for news classification
 * Used by both NewsCollector and KeywordAnalyzer
 */
export const CATEGORY_KEYWORDS: Record<NewsCategory, string[]> = {
  [NewsCategory.MACRO_FINANCE]: [
    'cpi', 'ppi', 'gdp', 'fed', '美联储', '利率', '债券', '国债',
    '美元', '人民币', '汇率', '通胀', '非农', '就业', '央行', '货币政策',
    '量化宽松', 'qt', 'fomc', '议息', '收益率', '降息', '加息',
    'inflation', 'interest', 'rate', 'bond', 'treasury', 'dollar', 'yuan',
  ],
  [NewsCategory.INDUSTRY]: [
    '行业', '板块', 'etf', '新能源', '半导体', '芯片', 'ai', '人工智能',
    '汽车', '地产', '房地产', '银行', '保险', '券商', '医药', '消费',
    'nvidia', 'openai', 'amazon', 'tesla', 'robot', 'tech', 'semiconductor',
  ],
  [NewsCategory.GEOPOLITICS]: [
    '战争', '冲突', '制裁', '贸易战', '关税', 'g20', '峰会', '外交',
    '俄罗斯', '乌克兰', '中东', '朝鲜', '伊朗', '欧盟', '北约',
    'russia', 'ukraine', 'iran', 'china', 'usa', 'war', 'sanction',
  ],
};

/**
 * Asset keywords for mapping news to asset classes
 */
export const ASSET_KEYWORDS: Record<string, string[]> = {
  'bond': ['美债', '国债', '债券', 'bond', 'treasury', 'yield'],
  'stock': ['股票', '股市', '指数', 'stock', 'index', 'nasdaq', 'dow'],
  'gold': ['黄金', 'gold', '金价'],
  'oil': ['原油', '石油', '油价', 'oil', 'petroleum'],
  'currency': ['汇率', '美元', '人民币', '日元', 'currency', 'dollar', 'yen'],
  'tech': ['科技', 'ai', '芯片', '半导体', 'tech', 'nvidia', '半导体'],
};

/**
 * HTTP request timeouts (in milliseconds)
 */
export const TIMEOUTS = {
  DEFAULT: 10000,
  API: 15000,
  SCRAPER: 10000,
} as const;

/**
 * News collection limits
 */
export const NEWS_LIMITS = {
  MIN_CONTENT_LENGTH: 50,      // Minimum content length for significant news
  MIN_SIGNIFICANT_ITEMS: 3,    // Minimum significant items to not trigger silence
  MAX_ITEMS_PER_SOURCE: 20,   // Maximum items to collect per source
  TOTAL_MAX_ITEMS: 100,        // Total maximum items after dedup
} as const;
