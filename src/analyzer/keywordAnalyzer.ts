/**
 * Keyword Analyzer - Fallback when LLM fails
 * Uses keyword matching to categorize and analyze news
 */

import { RawNewsCollection, NewsCategory, MacroReport, InvestmentAnalysis } from '../types';
import { logger } from '../utils/logger';
import { CATEGORY_KEYWORDS, ASSET_KEYWORDS } from '../constants';

/**
 * Keyword-based news analyzer (fallback when LLM fails)
 */
export class KeywordAnalyzer {
  private categoryKeywords: Record<NewsCategory, string[]>;
  private assetKeywords: Record<string, string[]>;

  constructor() {
    // Use shared constants for categorization
    this.categoryKeywords = CATEGORY_KEYWORDS;

    // Use shared constants for asset mapping
    this.assetKeywords = ASSET_KEYWORDS;
  }

  /**
   * Analyze news using keywords
   */
  analyze(collection: RawNewsCollection): MacroReport {
    const now = new Date();
    const dateStr = now.toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' });
    const timeStr = now.toLocaleTimeString('zh-CN', {
      timeZone: 'Asia/Shanghai',
      hour: '2-digit',
      minute: '2-digit',
    });

    logger.info('Using KeywordAnalyzer for news analysis');

    const macroItems = collection.items.filter(i => i.category === NewsCategory.MACRO_FINANCE);
    const industryItems = collection.items.filter(i => i.category === NewsCategory.INDUSTRY);
    const geoItems = collection.items.filter(i => i.category === NewsCategory.GEOPOLITICS);

    // Generate analyses for each category
    const analyses: InvestmentAnalysis[] = [];

    if (macroItems.length > 0) {
      analyses.push(this.analyzeCategory(macroItems, NewsCategory.MACRO_FINANCE, '宏观金融与大类资产'));
    }

    if (industryItems.length > 0) {
      analyses.push(this.analyzeCategory(industryItems, NewsCategory.INDUSTRY, '中观行业与资金博弈'));
    }

    if (geoItems.length > 0) {
      analyses.push(this.analyzeCategory(geoItems, NewsCategory.GEOPOLITICS, '地缘政治与宏观尾部风险'));
    }

    // Get unique sources
    const sources = [...new Set(collection.items.map(i => i.source))];

    return {
      title: `📈 FinMacroSentinel 财经时报 - ${dateStr} ${timeStr}`,
      date: dateStr,
      time: timeStr,
      analyses,
      isSilent: collection.items.length === 0,
      generatedAt: now,
    };
  }

  /**
   * Analyze a specific category
   */
  private analyzeCategory(
    items: { title: string; content: string; source: string; url: string }[],
    category: NewsCategory,
    theme: string
  ): InvestmentAnalysis {
    // Extract facts from news titles
    const facts = items.slice(0, 5).map(item => {
      // Clean and truncate title
      const title = item.title.length > 80 ? item.title.substring(0, 80) + '...' : item.title;
      return title;
    });

    // Determine asset mapping based on keywords
    const assetMapping = this.determineAssetMapping(items);

    // Determine trading level
    const tradingLevel = this.determineTradingLevel(items);

    // Determine risk boundary
    const riskBoundary = this.determineRiskBoundary(theme);

    // Get sources
    const sources = [...new Set(items.map(i => i.source))];

    return {
      category,
      coreFacts: facts,
      investmentDeduction: {
        assetMapping,
        tradingLevel: tradingLevel as '短期冲击' | '中期趋势拐点' | '长期配置逻辑',
        riskAndHedge: riskBoundary,
      },
      sources,
    };
  }

  /**
   * Determine asset mapping based on keywords
   */
  private determineAssetMapping(items: { title: string; content: string }[]): string {
    const text = items.map(i => `${i.title} ${i.content}`).join(' ').toLowerCase();

    const assets: string[] = [];
    const avoid: string[] = [];

    // Check for each asset class
    if (text.match(/gold|黄金|金价/)) {
      assets.push('黄金ETF');
    }
    if (text.match(/oil|原油|石油/)) {
      assets.push('能源ETF');
    }
    if (text.match(/bond|债券|国债|treasury/)) {
      assets.push('美债');
    }
    if (text.match(/nvidia|ai|tech|科技/)) {
      assets.push('科技股/AI主题ETF');
    }
    if (text.match(/fed|利率|通胀/)) {
      assets.push('美元指数');
    }

    // Check for negative indicators
    if (text.match(/recession|衰退|裁员/)) {
      avoid.push('高估值成长股');
    }
    if (text.match(/inflation|通胀/)) {
      avoid.push('长久期国债');
    }

    let result = '';
    if (assets.length > 0) {
      result += `关注: ${assets.join('、')}`;
    }
    if (avoid.length > 0) {
      result += ` | 规避: ${avoid.join('、')}`;
    }

    return result || '中性观望';
  }

  /**
   * Determine trading level
   */
  private determineTradingLevel(items: { title: string; content: string }[]): string {
    const text = items.map(i => `${i.title} ${i.content}`).join(' ').toLowerCase();

    // Check for long-term indicators
    if (text.match(/gdp|annual|全年/)) {
      return '长期配置逻辑';
    }
    // Check for medium-term indicators
    if (text.match(/quarter|q[1-4]|季度/)) {
      return '中期趋势';
    }
    // Check for short-term indicators
    if (text.match(/today|今日|盘中/)) {
      return '短期冲击';
    }

    return '中期趋势';
  }

  /**
   * Determine risk boundary
   */
  private determineRiskBoundary(theme: string): string {
    if (theme.includes('宏观')) {
      return '关注央行政策走向、通胀数据、失业率变化';
    }
    if (theme.includes('行业')) {
      return '关注需求变化、政策监管、技术路线变革';
    }
    if (theme.includes('地缘')) {
      return '关注局势缓和信号、贸易政策变化';
    }
    return '关注系统性风险';
  }
}

/**
 * Factory function to create keyword analyzer
 */
export function createKeywordAnalyzer(): KeywordAnalyzer {
  return new KeywordAnalyzer();
}
