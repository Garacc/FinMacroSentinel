/**
 * Weekly Report Generator
 * Generates weekly macro summary report at 00:00 every Monday
 */

import { getDatabase } from '../storage/db';
import { LLMClient } from './llmClient';
import { MarkdownStorage } from '../storage/markdownStorage';
import { logger } from '../utils/logger';
import { MacroReport } from '../types';

export interface WeeklyReportConfig {
  days?: number;  // Default: 7 days
}

/**
 * Generate weekly macro report
 */
export async function generateWeeklyReport(config: WeeklyReportConfig = {}): Promise<MacroReport> {
  const days = config.days || 7;
  const db = getDatabase();

  logger.info(`Generating weekly report for last ${days} days...`);

  // Calculate date range
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

  // Get news from last week
  const newsItems = db.getNewsByDateRange(startDate, endDate);

  if (newsItems.length === 0) {
    logger.warn('No news found for weekly report');
    return {
      title: '📈 FinMacroSentinel 周度宏观报告',
      date: new Date().toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' }),
      time: '00:00',
      analyses: [],
      isSilent: true,
      generatedAt: new Date(),
      sourceItems: [],
    };
  }

  logger.info(`Found ${newsItems.length} news items for weekly report`);

  // Get daily reports from this week
  const dailyReports = db.getReportsByType('daily', 5);

  // Build context for LLM
  const newsContext = buildNewsContext(newsItems);
  const dailyContext = buildDailyReportsContext(dailyReports);

  // Use LLM for macro analysis
  const llmClient = new LLMClient();
  const prompt = buildWeeklyPrompt(newsContext, dailyContext);

  try {
    const result = await llmClient.sendMessage(
      '你是具有20年经验的华尔街宏观对冲基金经理兼首席风控官。',
      prompt
    );
    const content = result.content;

    // Save to database
    db.saveReport('weekly', `周度宏观报告 - ${new Date().toLocaleDateString('zh-CN')}`, content);

    // Save to markdown
    const storage = new MarkdownStorage();
    const report: MacroReport = {
      title: `📈 FinMacroSentinel 周度宏观报告 - ${new Date().toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' })}`,
      date: new Date().toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' }),
      time: '00:00',
      analyses: [],
      isSilent: false,
      generatedAt: new Date(),
      sourceItems: [],
    };

    // Store raw content for markdown output
    (report as unknown as Record<string, unknown>).rawContent = content;

    await storage.save(report);

    logger.info('Weekly report generated successfully');
    return report;
  } catch (error) {
    logger.error('Failed to generate weekly report:', error);
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
  // Group by day
  const byDay: Record<string, typeof newsItems> = {};

  for (const item of newsItems) {
    const date = item.published_at ? new Date(item.published_at).toLocaleDateString('zh-CN') : '未知';
    if (!byDay[date]) {
      byDay[date] = [];
    }
    byDay[date].push(item);
  }

  const lines: string[] = [];

  for (const [date, items] of Object.entries(byDay).reverse().slice(0, 7)) {
    lines.push(`### ${date}`);
    for (const item of items.slice(0, 10)) { // Limit to 10 items per day
      const category = item.category || '未分类';
      lines.push(`- [${item.source}] ${item.title}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Build daily reports context
 */
function buildDailyReportsContext(reports: Array<{
  title: string;
  content: string;
  generated_at: string;
}>): string {
  if (reports.length === 0) {
    return '本周无日度报告';
  }

  return reports.map(r => {
    const date = new Date(r.generated_at).toLocaleDateString('zh-CN');
    return `## ${r.title}\n${r.content.slice(0, 2000)}...`; // Limit content length
  }).join('\n\n---\n\n');
}

/**
 * Build weekly report prompt
 */
function buildWeeklyPrompt(newsContext: string, dailyContext: string): string {
  return `你是具有20年经验的华尔街宏观对冲基金经理兼首席风控官。请基于过去一周的财经新闻和日度报告，撰写一份深度的周度宏观研究报告。

## 过去一周新闻概览

${newsContext}

## 本周日度报告摘要

${dailyContext}

## 报告要求

请按以下结构撰写报告：

### 一、周度核心事件回顾
回顾过去一周最重要的3-5个事件及其演变。

### 二、宏观周期与轮动分析
- 当前位置：当前处于经济周期的哪个阶段？
- 周期信号：哪些指标显示周期位置？
- 资产轮动：股票/债券/商品/现金的相对表现
- 跨资产相关性：哪些资产相关性发生变化？

### 三、地缘政治周度评估
- 风险地图：过去一周地缘风险变化
- 影响评估：对各类资产的可能影响

### 四、机构仓位与资金流
- 美股持仓变化
- 全球债市资金流向
- 商品市场持仓

### 五、周度投资推演
- 资产配置建议
- 交易级别：短期/中期/长期
- 边界条件与风控

### 六、展望下周
- 关键事件与数据
- 风险预警

要求：
- 使用机构级专业语言
- 不做预测，只做推演
- 给出URL信源，格式为：[来源名称 - 新闻标题](URL)，不要只显示来源名称
- 区分事实与观点
- 突出周期视角和轮动分析`
}
