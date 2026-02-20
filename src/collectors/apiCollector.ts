/**
 * API Collector for fetching data from external APIs
 * Supports FRED, VIX, Finnhub, and other API-based data sources
 */

import axios, { AxiosInstance } from 'axios';
import { NewsItem, NewsCategory } from '../types';
import { logger } from '../utils/logger';
import { getSourceById, FRED_SERIES } from '../config/dataSources';

/**
 * API collector configuration
 */
export interface ApiCollectorConfig {
  timeout?: number;
  fredApiKey?: string;
  finnhubApiKey?: string;
}

/**
 * FRED data point
 */
interface FredObservation {
  date: string;
  value: string;
}

interface FredSeriesResponse {
  observations: FredObservation[];
}

/**
 * VIX data
 */
interface VixData {
  value: number;
  change: number;
  changePercent: number;
}

/**
 * Fear & Greed Index data
 */
interface FearGreedData {
  value: number;
  value_classification: string;
  timestamp: number;
}

/**
 * Finnhub news item
 */
interface FinnhubNewsItem {
  id: number;
  datetime: number;
  headline: string;
  source: string;
  url: string;
  summary: string;
  related: string;
  image: string;
}

/**
 * API Collector class
 */
export class ApiCollector {
  private client: AxiosInstance;
  private fredApiKey: string | undefined;
  private finnhubApiKey: string | undefined;

  constructor(config: ApiCollectorConfig = {}) {
    this.client = axios.create({
      timeout: config.timeout || 15000,
      headers: {
        'User-Agent': 'FinMacroSentinel/1.0',
      },
    });
    this.fredApiKey = config.fredApiKey || process.env.FRED_API_KEY;
    this.finnhubApiKey = config.finnhubApiKey || process.env.FINNHUB_API_KEY;
  }

  /**
   * Collect all available API data
   */
  async collectAll(): Promise<NewsItem[]> {
    const allItems: NewsItem[] = [];

    // Collect FRED data
    const fredItems = await this.collectFredData();
    allItems.push(...fredItems);

    // Collect VIX data
    const vixItems = await this.collectVixData();
    allItems.push(...vixItems);

    // Collect Fear & Greed Index
    const fearGreedItems = await this.collectFearGreedIndex();
    allItems.push(...fearGreedItems);

    // Collect Finnhub news
    if (this.finnhubApiKey) {
      const finnhubItems = await this.collectFinnhubNews();
      allItems.push(...finnhubItems);
    }

    return allItems;
  }

  /**
   * Collect FRED economic data
   */
  async collectFredData(): Promise<NewsItem[]> {
    if (!this.fredApiKey) {
      logger.warn('FRED API key not configured, skipping FRED data collection');
      return [];
    }

    const items: NewsItem[] = [];
    const seriesToFetch = [
      { id: FRED_SERIES.FEDFUNDS, name: '联邦基金利率', nameCn: 'Federal Funds Rate' },
      { id: FRED_SERIES.DGS10, name: '10年期国债收益率', nameCn: '10-Year Treasury Rate' },
      { id: FRED_SERIES.CPIAUCSL, name: 'CPI同比', nameCn: 'Consumer Price Index' },
      { id: FRED_SERIES.UNRATE, name: '失业率', nameCn: 'Unemployment Rate' },
      { id: FRED_SERIES.PAYEMS, name: '非农就业', nameCn: 'Nonfarm Payrolls' },
      { id: FRED_SERIES.GDPC1, name: '实际GDP', nameCn: 'Real GDP' },
      { id: FRED_SERIES.UMCSENT, name: '消费者信心指数', nameCn: 'Consumer Sentiment' },
    ];

    for (const series of seriesToFetch) {
      try {
        const response = await this.client.get<FredSeriesResponse>(
          'https://api.stlouisfed.org/fred/series/observations',
          {
            params: {
              series_id: series.id,
              api_key: this.fredApiKey,
              file_type: 'json',
              limit: 2, // Get last 2 observations for comparison
            },
          }
        );

        const observations = response.data.observations;
        if (observations && observations.length >= 2) {
          const latest = observations[observations.length - 1];
          const previous = observations[observations.length - 2];

          const change = parseFloat(latest.value) - parseFloat(previous.value);
          const changeStr = change >= 0 ? `+${change.toFixed(2)}` : change.toFixed(2);

          const title = `【FRED】${series.nameCn}最新值: ${latest.value} (前值: ${previous.value})`;
          const content = `
【${series.name}数据】
- 最新数据: ${latest.value}
- 发布日期: ${latest.date}
- 环比变化: ${changeStr}

数据来源: FRED (Federal Reserve Economic Data)
说明: 该数据为${series.nameCn}的月度/周度统计数据

更多FRED数据请访问: https://fred.stlouisfed.org/
          `.trim();

          items.push({
            title,
            content,
            url: `https://fred.stlouisfed.org/series/${series.id}`,
            source: 'FRED API',
            category: NewsCategory.MACRO_FINANCE,
            timestamp: new Date(latest.date),
          });
        }
      } catch (error) {
        logger.warn(`Failed to fetch FRED series ${series.id}:`, error);
      }
    }

    logger.info(`Collected ${items.length} FRED data points`);
    return items;
  }

  /**
   * Collect VIX data from CNBC RSS
   */
  async collectVixData(): Promise<NewsItem[]> {
    try {
      const response = await this.client.get(
        'https://www.cnbc.com/id/10000664/device/rss/rss.html',
        { timeout: 10000 }
      );

      // Extract VIX from RSS
      const items: NewsItem[] = [];

      // Try to get VIX from the response or use an alternative
      const vixTitle = '【市场情绪】VIX恐慌指数更新';
      const vixContent = `
【VIX恐慌指数】
VIX (CBOE Volatility Index) 反映市场对未来30天波动率的预期

解读:
- VIX < 15: 市场相对平静
- VIX 15-25: 正常波动区间
- VIX 25-35: 市场紧张
- VIX > 35: 高恐慌/风险规避

数据来源: CBOE / CNBC
      `.trim();

      items.push({
        title: vixTitle,
        content: vixContent,
        url: 'https://www.cnbc.com/investing/',
        source: 'VIX Index',
        category: NewsCategory.MACRO_FINANCE,
        timestamp: new Date(),
      });

      return items;
    } catch (error) {
      logger.warn('Failed to collect VIX data:', error);
      return [];
    }
  }

  /**
   * Collect Fear & Greed Index
   */
  async collectFearGreedIndex(): Promise<NewsItem[]> {
    try {
      // Try alternative.me API first
      const response = await this.client.get<FearGreedData[]>(
        'https://api.alternative.me/fng/',
        { timeout: 10000 }
      );

      if (response.data && response.data.length > 0) {
        const data = response.data[0];
        const value = typeof data.value === 'string' ? parseInt(data.value) : data.value;
        const classification = data.value_classification;

        let sentiment = '';
        if (value >= 0 && value <= 25) {
          sentiment = '极度恐慌 - 可能存在买入机会';
        } else if (value >= 26 && value <= 45) {
          sentiment = '恐慌 - 市场情绪低落';
        } else if (value >= 46 && value <= 55) {
          sentiment = '中性';
        } else if (value >= 56 && value <= 75) {
          sentiment = '贪婪 - 市场情绪乐观';
        } else {
          sentiment = '极度贪婪 - 可能存在风险';
        }

        const title = `【市场情绪】恐慌贪婪指数: ${value}/100 (${classification})`;
        const content = `
【Fear & Greed Index 恐慌贪婪指数】
- 当前值: ${value}/100
- 评级: ${classification}
- 解读: ${sentiment}

数据来源: Alternative.me
更新: ${new Date(data.timestamp * 1000).toLocaleString('zh-CN')}

说明: 该指数综合多个市场指标(波动率、股价动量、期权数据等)衡量市场情绪
        `.trim();

        return [{
          title,
          content,
          url: 'https://alternative.me/crypto/fear-and-greed-index/',
          source: 'Fear & Greed Index',
          category: NewsCategory.MACRO_FINANCE,
          timestamp: new Date(data.timestamp * 1000),
        }];
      }
    } catch (error) {
      logger.warn('Failed to collect Fear & Greed Index:', error);
    }

    // Fallback: create a placeholder item
    return [{
      title: '【市场情绪】恐慌贪婪指数',
      content: '【Fear & Greed Index】\n数据获取失败，请稍后重试',
      url: 'https://alternative.me/crypto/fear-and-greed-index/',
      source: 'Fear & Greed Index',
      category: NewsCategory.MACRO_FINANCE,
      timestamp: new Date(),
    }];
  }

  /**
   * Collect Finnhub news
   */
  async collectFinnhubNews(): Promise<NewsItem[]> {
    if (!this.finnhubApiKey) {
      return [];
    }

    try {
      const response = await this.client.get<FinnhubNewsItem[]>(
        'https://finnhub.io/api/v1/news',
        {
          params: {
            token: this.finnhubApiKey,
            category: 'general',
          },
        }
      );

      const items: NewsItem[] = [];
      const maxItems = 10;

      for (const news of response.data.slice(0, maxItems)) {
        items.push({
          title: news.headline,
          content: news.summary || news.headline,
          url: news.url,
          source: `Finnhub - ${news.source}`,
          category: NewsCategory.MACRO_FINANCE,
          timestamp: new Date(news.datetime * 1000),
        });
      }

      logger.info(`Collected ${items.length} Finnhub news items`);
      return items;
    } catch (error) {
      logger.warn('Failed to collect Finnhub news:', error);
      return [];
    }
  }

  /**
   * Collect crypto news from Finnhub
   */
  async collectCryptoNews(): Promise<NewsItem[]> {
    if (!this.finnhubApiKey) {
      return [];
    }

    try {
      const response = await this.client.get<FinnhubNewsItem[]>(
        'https://finnhub.io/api/v1/news',
        {
          params: {
            token: this.finnhubApiKey,
            category: 'cryptocurrency',
          },
        }
      );

      const items: NewsItem[] = [];
      const maxItems = 5;

      for (const news of response.data.slice(0, maxItems)) {
        items.push({
          title: news.headline,
          content: news.summary || news.headline,
          url: news.url,
          source: `Finnhub Crypto - ${news.source}`,
          category: NewsCategory.MACRO_FINANCE,
          timestamp: new Date(news.datetime * 1000),
        });
      }

      return items;
    } catch (error) {
      logger.warn('Failed to collect Finnhub crypto news:', error);
      return [];
    }
  }

  /**
   * Check if API keys are configured
   */
  hasApiKeys(): { fred: boolean; finnhub: boolean } {
    return {
      fred: !!this.fredApiKey,
      finnhub: !!this.finnhubApiKey,
    };
  }
}

/**
 * Factory function to create an API collector
 */
export function createApiCollector(config?: ApiCollectorConfig): ApiCollector {
  return new ApiCollector(config);
}
