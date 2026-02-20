/**
 * News collector for gathering financial news from multiple sources
 * Classifies news into three themes: macro finance, industry, geopolitics
 */

import { Scraper, ScraperSource, DEFAULT_SOURCES } from './scraper';
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

/**
 * Keywords for categorizing news
 */
const CATEGORY_KEYWORDS: Record<NewsCategory, string[]> = {
  [NewsCategory.MACRO_FINANCE]: [
    'cpi', 'ppi', 'gdp', 'fed', '美联储', '利率', '债券', '国债',
    '美元', '人民币', '汇率', '通胀', '非农', '就业', '央行', '货币政策',
    '量化宽松', 'qt', 'fomc', '议息', '收益率', '降息', '加息',
  ],
  [NewsCategory.INDUSTRY]: [
    '行业', '板块', 'etf', '新能源', '半导体', '芯片', 'ai', '人工智能',
    '汽车', '地产', '房地产', '银行', '保险', '券商', '医药', '消费',
  ],
  [NewsCategory.GEOPOLITICS]: [
    '战争', '冲突', '制裁', '贸易战', '关税', 'g20', '峰会', '外交',
    '俄罗斯', '乌克兰', '中东', '朝鲜', '伊朗', '欧盟', '北约',
  ],
};

/**
 * News collector class
 */
export class NewsCollector {
  private scraper: Scraper;
  private sources: ScraperSource[];

  constructor(sources?: ScraperSource[]) {
    this.sources = sources || EXTENDED_SOURCES;
    this.scraper = new Scraper({}, this.sources);
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
   */
  async collect(timeRange?: TimeRange): Promise<RawNewsCollection> {
    logger.info('Starting news collection...');

    const rawItems = await this.scraper.scrapeAll();

    // Filter by time range if provided
    const filteredItems = this.filterByTimeRange(rawItems, timeRange);
    const classifiedItems = filteredItems.map(item => this.classifyNewsItem(item));

    // Group by category for analysis
    const groupedByCategory = this.groupByCategory(classifiedItems);

    for (const [category, items] of Object.entries(groupedByCategory)) {
      logger.info(`Category ${category}: ${items.length} items`);
    }

    logger.info(`Total collected: ${classifiedItems.length} items`);

    return {
      items: classifiedItems,
      collectedAt: new Date(),
      sourceCount: new Set(filteredItems.map(i => i.source)).size,
    };
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

    // Lower threshold - if we have any news, analyze it
    // Filter for potentially significant news (even short content counts)
    const significantItems = collection.items.filter(
      item => item.content.length > 10
    );

    return significantItems.length >= 1;
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
