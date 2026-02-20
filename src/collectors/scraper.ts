/**
 * Web scraper for fetching financial news from various sources
 * Uses axios and cheerio for HTML parsing
 */

import axios, { AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';
import { logger } from '../utils/logger';
import { NewsItem, NewsCategory } from '../types';

export interface ScraperConfig {
  timeout?: number;
  userAgent?: string;
}

export interface ScraperSource {
  name: string;
  url: string;
  category: NewsCategory;
}

/**
 * RSS Feed URLs for financial news
 */
const RSS_FEEDS = [
  {
    name: 'MarketWatch RSS',
    url: 'https://feeds.marketwatch.com/marketwatch/topstories/',
    category: NewsCategory.MACRO_FINANCE,
  },
  {
    name: 'CNBC RSS',
    url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html',
    category: NewsCategory.MACRO_FINANCE,
  },
  {
    name: 'CNN Business RSS',
    url: 'http://rss.cnn.com/rss/money_topstories.rss',
    category: NewsCategory.MACRO_FINANCE,
  },
  {
    name: 'BBC Business RSS',
    url: 'https://feeds.bbci.co.uk/news/business/rss.xml',
    category: NewsCategory.MACRO_FINANCE,
  },
];

/**
 * Default financial news sources - using RSS feeds for reliability
 */
export const DEFAULT_SOURCES: ScraperSource[] = [
  // RSS Feeds (most reliable)
  ...RSS_FEEDS,
  // Chinese sources - direct scraping
  {
    name: '新浪财经',
    url: 'https://finance.sina.com.cn/macro/',
    category: NewsCategory.MACRO_FINANCE,
  },
  {
    name: '网易财经',
    url: 'https://money.163.com/',
    category: NewsCategory.MACRO_FINANCE,
  },
  {
    name: '华尔街见闻',
    url: 'https://wallstreetcn.com/news/global',
    category: NewsCategory.MACRO_FINANCE,
  },
  {
    name: '金十数据',
    url: 'https://www.jin10.com/',
    category: NewsCategory.MACRO_FINANCE,
  },
  {
    name: '凤凰网财经',
    url: 'https://finance.ifeng.com/c/80',
    category: NewsCategory.MACRO_FINANCE,
  },
  {
    name: '同花顺',
    url: 'https://www.10jqka.com.cn/',
    category: NewsCategory.MACRO_FINANCE,
  },
];

/**
 * Web scraper class for fetching news
 */
export class Scraper {
  private client: AxiosInstance;
  private sources: ScraperSource[];

  constructor(config: ScraperConfig = {}, sources: ScraperSource[] = DEFAULT_SOURCES) {
    this.client = axios.create({
      timeout: config.timeout || 10000,
      headers: {
        'User-Agent': config.userAgent || 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
    this.sources = sources;
  }

  /**
   * Add a new source to scrape
   */
  addSource(source: ScraperSource): void {
    this.sources.push(source);
  }

  /**
   * Fetch and parse a single URL with retry logic
   */
  async scrapeUrl(url: string, sourceName: string, category: NewsCategory, maxRetries: number = 3): Promise<NewsItem[]> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info(`Scraping: ${url} (attempt ${attempt}/${maxRetries})`);
        const response = await this.client.get(url);
        const html = response.data;

      // Check if it's RSS feed
      if (html.includes('<rss') || html.includes('<feed')) {
        return this.parseRSS(html, sourceName, category);
      }

      const $ = cheerio.load(html);

      const items: NewsItem[] = [];

      // Try different selectors based on common news site structures
      const articleSelectors = [
        'article',
        '.news-item',
        '.story-item',
        '.market-news-item',
        '[data-testid="story-headline"]',
        '.headline',
        '.news_article',
        '.article-item',
      ];

      for (const selector of articleSelectors) {
        $(selector).each((_, element) => {
          const title = $(element).find('h2, h3, a').first().text().trim();
          const link = $(element).find('a').first().attr('href');
          const summary = $(element).find('p').first().text().trim();

          if (title && link) {
            const fullUrl = link.startsWith('http') ? link : new URL(link, url).href;
            items.push({
              title,
              content: summary || title,
              url: fullUrl,
              source: sourceName,
              category,
              timestamp: new Date(),
            });
          }
        });

        if (items.length > 0) break;
      }

      // Fallback: try to find any links
      if (items.length === 0) {
        $('a').each((_, element) => {
          const href = $(element).attr('href');
          const text = $(element).text().trim();

          if (href && text && text.length > 10) {
            const fullUrl = href.startsWith('http') ? href : new URL(href, url).href;
            if (fullUrl.includes('news') || fullUrl.includes('market') || fullUrl.includes('finance')) {
              items.push({
                title: text,
                content: text,
                url: fullUrl,
                source: sourceName,
                category,
                timestamp: new Date(),
              });
            }
          }
        });
      }

      logger.info(`Found ${items.length} items from ${sourceName}`);
      return items.slice(0, 10); // Limit to 10 items per source
    } catch (error) {
      lastError = error as Error;
      logger.warn(`Failed to scrape ${url} (attempt ${attempt}/${maxRetries}):`, error);

      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt - 1) * 1000;
        await this.sleep(delay);
      }
    }
    }

    // All retries failed
    logger.error(`Failed to scrape ${url} after ${maxRetries} attempts:`, lastError);
    return [];
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Parse RSS feed
   */
  private parseRSS(html: string, sourceName: string, category: NewsCategory): NewsItem[] {
    const items: NewsItem[] = [];
    const $ = cheerio.load(html, { xmlMode: true });

    $('item').each((_, element) => {
      const title = $(element).find('title').first().text().trim();
      const link = $(element).find('link').first().text().trim();
      const description = $(element).find('description').first().text().trim();
      const pubDate = $(element).find('pubDate').first().text().trim();

      if (title && link) {
        // Clean HTML from description
        const cleanDescription = description.replace(/<[^>]*>/g, '').trim();

        items.push({
          title,
          content: cleanDescription || title,
          url: link,
          source: sourceName,
          category,
          timestamp: pubDate ? new Date(pubDate) : new Date(),
        });
      }
    });

    // Also try Atom format
    if (items.length === 0) {
      $('entry').each((_, element) => {
        const title = $(element).find('title').first().text().trim();
        const link = $(element).find('link').first().attr('href') || '';
        const description = $(element).find('summary, content').first().text().trim();
        const pubDate = $(element).find('published, updated').first().text().trim();

        if (title) {
          const cleanDescription = description.replace(/<[^>]*>/g, '').trim();

          items.push({
            title,
            content: cleanDescription || title,
            url: link,
            source: sourceName,
            category,
            timestamp: pubDate ? new Date(pubDate) : new Date(),
          });
        }
      });
    }

    logger.info(`Found ${items.length} RSS items from ${sourceName}`);
    return items;
  }

  /**
   * Scrape all configured sources
   */
  async scrapeAll(): Promise<NewsItem[]> {
    const allItems: NewsItem[] = [];

    for (const source of this.sources) {
      const items = await this.scrapeUrl(source.url, source.name, source.category);
      allItems.push(...items);
    }

    return allItems;
  }

  /**
   * Get current sources
   */
  getSources(): ScraperSource[] {
    return [...this.sources];
  }
}

/**
 * Factory function to create a scraper with default configuration
 */
export function createScraper(): Scraper {
  return new Scraper();
}
