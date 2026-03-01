/**
 * Feishu Card Builder
 * Constructs Feishu interactive card JSON payloads
 */

import { MacroReport, FeishuCard, NewsItem } from '../types';

/**
 * Inject tags into source URLs in markdown content for Feishu text_tag display
 * Transforms: [Source Name](URL) -> <text_tag>tag</text_tag> [Source Name](URL)
 */
function injectTagsToSourcesForFeishu(content: string, sourceItems: NewsItem[]): string {
  if (!sourceItems || sourceItems.length === 0) {
    return content;
  }

  // Build URL -> tags mapping (flatten all tags to string array)
  const urlTagMap = new Map<string, string[]>();
  for (const item of sourceItems) {
    if (item.tags) {
      const allTags: string[] = [];
      // Flatten all tag types into a single array
      if (item.tags.primary) allTags.push(...item.tags.primary);
      if (item.tags.asset) allTags.push(...item.tags.asset);
      if (item.tags.region) allTags.push(...item.tags.region);
      if (item.tags.time) allTags.push(...item.tags.time);
      if (allTags.length > 0) {
        urlTagMap.set(item.url, allTags);
      }
    }
  }

  // Replace pattern: [Source Name](URL) -> <text_tag>tag</text_tag> [Source Name](URL)
  const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
  return content.replace(regex, (match, sourceName, url) => {
    const tags = urlTagMap.get(url);
    if (tags && tags.length > 0) {
      // Convert tags to text_tag elements
      const tagElements = tags.map(tag =>
        `<text_tag color='blue'>${tag}</text_tag>`
      ).join(' ');
      return `${tagElements} [${sourceName}](${url})`;
    }
    return match;
  });
}

export interface CardBuilderConfig {
  wideScreenMode?: boolean;
  headerTemplate?: 'blue' | 'green' | 'red' | 'yellow' | 'grey' | 'wathet' | 'turquoise' | 'carmine' | 'violet' | 'purple' | 'indigo' | 'default';
}

/**
 * Card Builder class
 * Builds Feishu message cards from macro reports
 */
export class CardBuilder {
  private config: Required<CardBuilderConfig>;

  constructor(config: CardBuilderConfig = {}) {
    this.config = {
      wideScreenMode: config.wideScreenMode ?? true,
      headerTemplate: config.headerTemplate ?? 'blue',
    };
  }

  /**
   * Build a Feishu card from a macro report (JSON 2.0 format)
   */
  buildCard(report: MacroReport): FeishuCard {
    // Determine header template based on content
    let headerTemplate = this.config.headerTemplate;
    if (report.isSilent) {
      headerTemplate = 'grey';
    }

    // Build card content
    let content = this.buildCardContent(report);

    // JSON 2.0 format with body element
    return {
      schema: '2.0',
      config: {
        wide_screen_mode: this.config.wideScreenMode,
        update_multi: true,
      },
      header: {
        title: {
          tag: 'plain_text',
          content: report.title,
        },
        template: headerTemplate,
      },
      body: {
        elements: [
          {
            tag: 'markdown',
            content,
          },
        ],
      },
    };
  }

  /**
   * Build card content from report
   */
  private buildCardContent(report: MacroReport): string {
    // If there's raw content, inject tags for Feishu
    if ((report as unknown as Record<string, unknown>).rawContent) {
      let content = (report as unknown as Record<string, unknown>).rawContent as string;

      // Inject tags into source URLs using text_tag for Feishu
      if (report.sourceItems && report.sourceItems.length > 0) {
        content = injectTagsToSourcesForFeishu(content, report.sourceItems);
      }

      return content;
    }

    // If silent, use silence message
    if (report.isSilent) {
      return '## 📢 信息公告\n\n当前时段信息静默，无重大宏观异动';
    }

    // If error, show error message
    if ((report as unknown as Record<string, unknown>).error) {
      return `## ⚠️ 分析出错\n\n${(report as unknown as Record<string, unknown>).error}`;
    }

    // Build from structured data
    const parts: string[] = [];

    for (const analysis of report.analyses) {
      parts.push(this.formatAnalysis(analysis));
    }

    return parts.join('\n\n');
  }

  /**
   * Format a single analysis
   */
  private formatAnalysis(analysis: {
    category: string;
    coreFacts: string[];
    investmentDeduction: {
      assetMapping: string;
      tradingLevel: string;
      riskAndHedge: string;
    };
    sources: string[];
  }): string {
    const lines: string[] = [];

    // Category header
    const categoryHeaders: Record<string, string> = {
      macro_finance: '🌍 主题一：宏观金融与大类资产',
      industry: '🏭 主题二：行业中观',
      geopolitics: '🌍 主题三：地缘政治',
    };

    lines.push(categoryHeaders[analysis.category] || analysis.category);
    lines.push('');

    // Core facts
    lines.push('【核心事实】');
    for (const fact of analysis.coreFacts) {
      lines.push(`- ${fact}`);
    }
    lines.push('');

    // Sources
    if (analysis.sources.length > 0) {
      lines.push(`信息来源：${analysis.sources.join(' / ')}`);
      lines.push('');
    }

    // Investment deduction
    lines.push('【投资推演】');
    lines.push(`- 资产映射：${analysis.investmentDeduction.assetMapping}`);
    lines.push(`- 交易级别：${analysis.investmentDeduction.tradingLevel}`);
    lines.push(`- 边界条件与风控：${analysis.investmentDeduction.riskAndHedge}`);

    return lines.join('\n');
  }

  /**
   * Truncate content if it exceeds Feishu card limits
   */
  truncateContent(content: string, maxLength: number = 8000): string {
    if (content.length <= maxLength) {
      return content;
    }

    // Find a good breaking point (at least 100 chars from end)
    const truncated = content.slice(0, maxLength - 100);
    const lastNewline = truncated.lastIndexOf('\n');

    if (lastNewline > maxLength - 500) {
      return truncated.slice(0, lastNewline) + '\n\n_...内容已截断_';
    }

    return truncated + '\n\n_...内容已截断_';
  }
}

/**
 * Factory function to create a card builder
 */
export function createCardBuilder(config?: CardBuilderConfig): CardBuilder {
  return new CardBuilder(config);
}
