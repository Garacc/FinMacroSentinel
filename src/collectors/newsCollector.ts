/**
 * News collector for gathering financial news from multiple sources
 * Classifies news into three themes: macro finance, industry, geopolitics
 */

import { Scraper, ScraperSource, DEFAULT_SOURCES, getApiSources } from './scraper';
import { DataCleaner, createDataCleaner } from './dataCleaner';
import { ApiCollector, createApiCollector } from './apiCollector';
import { logger } from '../utils/logger';
import { NewsItem, NewsCategory, RawNewsCollection } from '../types';

/**
 * Time range configuration for different run times
 * Returns the time range (start, end) based on current run hour
 */
export interface TimeRange {
  start: Date;
  end: Date;
}

/**
 * Calculate time range based on current run time
 * Each run gets news from the previous run's end time to now
 */
export function calculateTimeRange(): TimeRange {
  const now = new Date();
  const hour = now.getHours();

  let start: Date;

  // Define time windows for each scheduled run (Beijing time)
  if (hour >= 8 && hour < 11) {
    // Morning run (around 09:00): Get news from 21:00 yesterday to 09:00 today
    start = new Date(now);
    start.setHours(21, 0, 0, 0);
    if (start > now) {
      // If 21:00 is in the future, it means we're past midnight but before 21:00 today
      // So use yesterday's 21:00
      start.setDate(start.getDate() - 1);
    }
  } else if (hour >= 11 && hour < 15) {
    // Noon run (around 12:30): Get news from 09:00 to 12:30 today
    start = new Date(now);
    start.setHours(9, 0, 0, 0);
  } else if (hour >= 18 && hour < 23) {
    // Evening run (around 21:00): Get news from 12:30 to 21:00 today
    start = new Date(now);
    start.setHours(12, 30, 0, 0);
  } else {
    // Late night/early morning: Get news from the last 6 hours
    start = new Date(now.getTime() - 6 * 60 * 60 * 1000);
  }

  logger.info(`Time range: ${start.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })} - ${now.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`);

  return { start, end: now };
}

/**
 * Extended sources with more categories
 */
const EXTENDED_SOURCES: ScraperSource[] = [
  ...DEFAULT_SOURCES,
  // Industry - Chinese sources
  {
    name: '新浪财经-股票',
    url: 'https://finance.sina.com.cn/stock/',
    category: NewsCategory.INDUSTRY,
  },
  {
    name: '网易财经-行业',
    url: 'https://money.163.com/stock/',
    category: NewsCategory.INDUSTRY,
  },
  {
    name: '同花顺-行业',
    url: 'https://www.10jqka.com.cn/stock/news/',
    category: NewsCategory.INDUSTRY,
  },
  {
    name: '金十数据-快讯',
    url: 'https://www.jin10.com/',
    category: NewsCategory.INDUSTRY,
  },
  // Geopolitics - Chinese sources
  {
    name: '新浪新闻-国际',
    url: 'https://news.sina.com.cn/world/',
    category: NewsCategory.GEOPOLITICS,
  },
  {
    name: '网易新闻-国际',
    url: 'https://news.163.com/world/',
    category: NewsCategory.GEOPOLITICS,
  },
  {
    name: '凤凰网-国际',
    url: 'https://news.ifeng.com/world/',
    category: NewsCategory.GEOPOLITICS,
  },
];

// Import shared constants
import { CATEGORY_KEYWORDS, NEWS_LIMITS } from '../constants';

/**
 * News collector class
 */
export class NewsCollector {
  private scraper: Scraper;
  private sources: ScraperSource[];
  private dataCleaner: DataCleaner;
  private apiCollector: ApiCollector;
  private useApiSources: boolean;

  constructor(sources?: ScraperSource[], useApiSources: boolean = true) {
    this.sources = sources || EXTENDED_SOURCES;
    this.scraper = new Scraper({}, this.sources);
    this.dataCleaner = createDataCleaner();
    this.apiCollector = createApiCollector();
    this.useApiSources = useApiSources;
  }

  /**
   * Determine category based on content keywords
   */
  private categorizeByKeywords(title: string, content: string): NewsCategory {
    const text = `${title} ${content}`.toLowerCase();

    // Score each category
    const scores: Record<NewsCategory, number> = {
      [NewsCategory.MACRO_FINANCE]: 0,
      [NewsCategory.INDUSTRY]: 0,
      [NewsCategory.GEOPOLITICS]: 0,
    };

    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      for (const keyword of keywords) {
        if (text.includes(keyword.toLowerCase())) {
          scores[category as NewsCategory]++;
        }
      }
    }

    // Find category with highest score
    let maxScore = 0;
    let bestCategory = NewsCategory.MACRO_FINANCE;

    for (const [category, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        bestCategory = category as NewsCategory;
      }
    }

    return bestCategory;
  }

  /**
   * Classify a news item into appropriate category
   */
  private classifyNewsItem(item: NewsItem): NewsItem {
    // If source already has a category, use it as a hint
    // But also check content for better classification
    const contentCategory = this.categorizeByKeywords(item.title, item.content);

    // Prefer content-based classification over source-based
    return {
      ...item,
      category: contentCategory,
    };
  }

  /**
   * Filter news items by time range
   */
  private filterByTimeRange(items: NewsItem[], timeRange?: TimeRange): NewsItem[] {
    if (!timeRange) {
      return items;
    }

    const filtered = items.filter(item => {
      const newsTime = item.timestamp.getTime();
      return newsTime >= timeRange.start.getTime() && newsTime <= timeRange.end.getTime();
    });

    logger.info(`Filtered by time range: ${filtered.length} / ${items.length} items`);

    return filtered;
  }

  /**
   * Collect news from all sources
   * @param timeRange Optional time range to filter news (for non-overlapping runs)
   * @param includeApi Whether to include API data sources (FRED, VIX, etc.)
   */
  async collect(timeRange?: TimeRange, includeApi: boolean = true): Promise<RawNewsCollection> {
    logger.info('Starting news collection...');

    // Collect from web sources (RSS + HTML)
    const webItems = await this.scraper.scrapeAll();

    // Collect from API sources (FRED, VIX, Finnhub)
    let apiItems: NewsItem[] = [];
    if (includeApi && this.useApiSources) {
      try {
        apiItems = await this.apiCollector.collectAll();
        logger.info(`Collected ${apiItems.length} items from API sources`);
      } catch (error) {
        logger.warn('Failed to collect from API sources:', error);
      }
    }

    // Combine all items
    const allItems = [...webItems, ...apiItems];

    // Filter by time range if provided
    const filteredItems = this.filterByTimeRange(allItems, timeRange);

    // Apply data cleaning (deduplication, truncation, merging)
    const cleanedItems = this.dataCleaner.process(filteredItems);

    // Deduplicate by URL (additional pass)
    const deduplicatedItems = this.deduplicateByUrl(cleanedItems);
    logger.info(`Deduplicated: ${deduplicatedItems.length} / ${cleanedItems.length} items`);

    // Classify items
    const classifiedItems = deduplicatedItems.map(item => this.classifyNewsItem(item));

    // Mix English and Chinese sources (10 each)
    const mixedItems = this.mixEnglishChinese(classifiedItems);

    // Group by category for analysis
    const groupedByCategory = this.groupByCategory(mixedItems);

    for (const [category, items] of Object.entries(groupedByCategory)) {
      logger.info(`Category ${category}: ${items.length} items`);
    }

    // Get statistics
    const stats = this.dataCleaner.getStatistics(mixedItems);
    logger.info(`Total collected: ${mixedItems.length} items, avg content length: ${stats.avgContentLength} chars`);

    return {
      items: mixedItems,
      collectedAt: new Date(),
      sourceCount: new Set(deduplicatedItems.map(i => i.source)).size,
    };
  }

  /**
   * Deduplicate news items by URL
   */
  private deduplicateByUrl(items: NewsItem[]): NewsItem[] {
    const seenUrls = new Set<string>();
    const uniqueItems: NewsItem[] = [];

    for (const item of items) {
      if (!seenUrls.has(item.url)) {
        seenUrls.add(item.url);
        uniqueItems.push(item);
      }
    }

    return uniqueItems;
  }

  /**
   * Mix English and Chinese sources for diversity
   * Priority: 10 English + 10 Chinese
   */
  private mixEnglishChinese(items: NewsItem[]): NewsItem[] {
    // Define English and Chinese sources
    const englishKeywords = ['bloomberg', 'reuters', 'cnbc', 'wsj', 'marketwatch', 'bbc', 'cnn', 'ft', 'investing'];
    const chineseKeywords = ['新浪', '网易', '华尔街见闻', '凤凰网', '东方财富', '金十', '同花顺', '腾讯', '阿里'];

    const englishItems: NewsItem[] = [];
    const chineseItems: NewsItem[] = [];
    const otherItems: NewsItem[] = [];

    for (const item of items) {
      const sourceLower = item.source.toLowerCase();
      const isEnglish = englishKeywords.some(k => sourceLower.includes(k));
      const isChinese = chineseKeywords.some(k => item.source.includes(k) || sourceLower.includes(k));

      if (isEnglish) {
        englishItems.push(item);
      } else if (isChinese) {
        chineseItems.push(item);
      } else {
        otherItems.push(item);
      }
    }

    // Mix: 10 English + 10 Chinese + others
    const result = [
      ...englishItems.slice(0, 10),
      ...chineseItems.slice(0, 10),
      ...otherItems,
    ];

    return result.slice(0, 20);
  }

  /**
   * Group news items by category
   */
  private groupByCategory(items: NewsItem[]): Record<NewsCategory, NewsItem[]> {
    const groups: Record<NewsCategory, NewsItem[]> = {
      [NewsCategory.MACRO_FINANCE]: [],
      [NewsCategory.INDUSTRY]: [],
      [NewsCategory.GEOPOLITICS]: [],
    };

    for (const item of items) {
      groups[item.category].push(item);
    }

    return groups;
  }

  /**
   * Check if there's significant news to report
   */
  hasSignificantNews(collection: RawNewsCollection): boolean {
    // Check if we have at least some news items
    if (collection.items.length === 0) {
      return false;
    }

    // Filter for significant news items using shared constants
    const significantItems = collection.items.filter(
      item => item.content.length > NEWS_LIMITS.MIN_CONTENT_LENGTH
    );

    return significantItems.length >= NEWS_LIMITS.MIN_SIGNIFICANT_ITEMS;
  }

  /**
   * Generate silence message when no significant news
   */
  generateSilenceMessage(): RawNewsCollection {
    return {
      items: [],
      collectedAt: new Date(),
      sourceCount: 0,
    };
  }
}

/**
 * Factory function to create a news collector
 */
export function createNewsCollector(): NewsCollector {
  return new NewsCollector();
}
