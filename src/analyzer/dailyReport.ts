/**
 * Daily Report Generator
 * Generates in-depth daily summary at 6:00 AM
 */

import { getDatabase } from '../storage/db';
import { LLMClient } from './llmClient';
import { MarkdownStorage } from '../storage/markdownStorage';
import { logger } from '../utils/logger';
import { MacroReport } from '../types';

export interface DailyReportConfig {
  hours?: number;  // Default: 24 hours
}

/**
 * Generate daily in-depth report
 */
export async function generateDailyReport(config: DailyReportConfig = {}): Promise<MacroReport> {
  const hours = config.hours || 24;
  const db = getDatabase();

  logger.info(`Generating daily report for last ${hours} hours...`);

  // Get news from last 24 hours
  const newsItems = db.getRecentNews(hours, 200);

  if (newsItems.length === 0) {
    logger.warn('No news found for daily report');
    return {
      title: '📊 FinMacroSentinel 日度深度报告',
      date: new Date().toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' }),
      time: '06:00',
      analyses: [],
      isSilent: true,
      generatedAt: new Date(),
      sourceItems: [],
    };
  }

  logger.info(`Found ${newsItems.length} news items for daily report`);

  // Build context for LLM
  const newsContext = buildNewsContext(newsItems);

  // Use LLM for deep analysis
  const llmClient = new LLMClient();
  const userPrompt = buildDailyPrompt(newsContext);

  try {
    const result = await llmClient.sendMessage(
      '你是具有20年经验的华尔街宏观对冲基金经理兼首席风控官。',
      userPrompt
    );
    const content = result.content;

    // Save to database
    db.saveReport('daily', `日度深度报告 - ${new Date().toLocaleDateString('zh-CN')}`, content);

    // Save to markdown
    const storage = new MarkdownStorage();
    const report: MacroReport = {
      title: `📊 FinMacroSentinel 日度深度报告 - ${new Date().toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' })}`,
      date: new Date().toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' }),
      time: '06:00',
      analyses: [],
      isSilent: false,
      generatedAt: new Date(),
      sourceItems: [],
    };

    // Store raw content for markdown output
    (report as unknown as Record<string, unknown>).rawContent = content;

    await storage.save(report);

    logger.info('Daily report generated successfully');
    return report;
  } catch (error) {
    logger.error('Failed to generate daily report:', error);
    throw error;
  }
}

/**
 * Build news context for LLM
 */
function buildNewsContext(newsItems: Array<{
  title: string;
  source: string;
  url: string;
  published_at: string | null;
  category: string | null;
  tags: string | null;
}>): string {
  const items = newsItems.map(item => {
    const time = item.published_at ? new Date(item.published_at).toLocaleString('zh-CN') : '未知';
    const category = item.category || '未分类';
    const tags = item.tags ? JSON.parse(item.tags) : {};
    const tagStr = Object.values(tags).filter(Boolean).join(', ');

    return `## ${item.source} [${category}]${tagStr ? ` [${tagStr}]` : ''}
- ${item.title}
- 时间: ${time}
- 链接: ${item.url}`;
  });

  return items.join('\n\n');
}

/**
 * Build daily report prompt
 */
function buildDailyPrompt(newsContext: string): string {
  return `你是具有20年经验的华尔街宏观对冲基金经理兼首席风控官。请基于过去24小时的财经新闻，撰写一份深度的日度宏观研究报告。

## 过去24小时新闻素材

${newsContext}

## 报告要求

请按以下结构撰写报告：

### 一、核心事件与市场定价
列出过去24小时内最重要的3-5个事件，以及市场对此的反应。

### 二、宏观主题分析
- 宏观经济：GDP、通胀、就业、利率等
- 大类资产：股票、债券、外汇、商品
- 地缘政治：关键风险事件

### 三、投资推演
针对每个宏观主题，给出：
- 资产映射：相关资产类别/ETF
- 交易级别：短期/中期/长期
- 边界条件与风控：风险提示

### 四、关键数据点
列出值得关注的宏观数据及其意义。

### 五、风险警示
列出当前主要风险点。

要求：
- 使用机构级专业语言
- 不做预测，只做推演
- 给出URL信源，格式为：[新闻标题](URL)，不要只显示来源名称
- 区分事实与观点`
}
