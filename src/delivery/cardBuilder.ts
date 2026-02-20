/**
 * Feishu Card Builder
 * Constructs Feishu interactive card JSON payloads
 */

import { MacroReport, FeishuCard } from '../types';

export interface CardBuilderConfig {
  wideScreenMode?: boolean;
  headerTemplate?: 'blue' | 'green' | 'red' | 'yellow' | 'grey';
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
   * Build a Feishu card from a macro report
   */
  buildCard(report: MacroReport): FeishuCard {
    // Determine header template based on content
    let headerTemplate = this.config.headerTemplate;
    if (report.isSilent) {
      headerTemplate = 'grey';
    }

    // Build card content
    let content = this.buildCardContent(report);

    return {
      config: {
        wide_screen_mode: this.config.wideScreenMode,
      },
      header: {
        title: {
          tag: 'plain_text',
          content: report.title,
        },
        template: headerTemplate,
      },
      elements: [
        {
          tag: 'div',
          text: {
            tag: 'markdown',
            content,
          },
        },
      ],
    };
  }

  /**
   * Build card content from report
   */
  private buildCardContent(report: MacroReport): string {
    // If there's raw content, use it directly
    if ((report as unknown as Record<string, unknown>).rawContent) {
      return (report as unknown as Record<string, unknown>).rawContent as string;
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
