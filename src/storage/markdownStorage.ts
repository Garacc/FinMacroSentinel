/**
 * Markdown Storage Module
 * Handles local file storage with YYYYMMDDHH naming convention
 */

import fs from 'fs';
import path from 'path';
import { config as globalConfig } from '../config';
import { logger } from '../utils/logger';
import { MacroReport, StorageMetadata, NewsCategory, NewsItem } from '../types';
import { tagsToString } from '../constants';

/**
 * Fix reference-style markdown links like [title][tag1][tag2](url)
 * Convert to: [tag1][tag2] [title](url)
 * LLM sometimes generates incorrect reference-style links
 */
function fixReferenceLinks(content: string): string {
  // Match: [text][tag1][tag2](url) or [text][tag](url)
  // Captures: 1=title, 2=allTags, 3=lastTag, 4=url
  // Convert to: [tag1][tag2] [title](url) with space for compatibility
  return content.replace(/\[([^\]]+)\]((\[[^\]]+\])+)\(([^)]+)\)/g, (_match, title, allTags, _lastTag, url) => {
    return `${allTags} [${title}](${url})`;
  });
}

export interface MarkdownStorageConfig {
  outputDir?: string;
}

/**
 * Markdown Storage class
 * Manages local file storage for reports
 */
export class MarkdownStorage {
  private outputDir: string;

  constructor(config: MarkdownStorageConfig = {}) {
    this.outputDir = config.outputDir || globalConfig.storage.outputDir || './output';
    this.ensureDirectory();
  }

  /**
   * Ensure output directory exists
   */
  private ensureDirectory(): void {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
      logger.info(`Created output directory: ${this.outputDir}`);
    }
  }

  /**
   * Generate filename from date
   * Format: YYYYMMDDHH.md
   */
  private generateFilename(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');

    return `${year}${month}${day}${hour}.md`;
  }

  /**
   * Convert report to Markdown format (RAG-friendly)
   */
  private formatAsMarkdown(report: MacroReport): string {
    const lines: string[] = [];

    // Header
    lines.push(`# ${report.title}`);
    lines.push('');
    lines.push(`**生成时间**: ${report.generatedAt.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`);
    lines.push('');

    // Check if silent
    if (report.isSilent) {
      lines.push('## 📢 信息公告');
      lines.push('');
      lines.push('当前时段信息静默，无重大宏观异动');
      lines.push('');
      return lines.join('\n');
    }

    // Check for errors
    if ((report as unknown as Record<string, unknown>).error) {
      lines.push('## ⚠️ 错误');
      lines.push('');
      lines.push(`分析过程中出现错误: ${(report as unknown as Record<string, unknown>).error}`);
      lines.push('');
      return lines.join('\n');
    }

    // Raw content from LLM
    if ((report as unknown as Record<string, unknown>).rawContent) {
      let content = (report as unknown as Record<string, unknown>).rawContent as string;

      // Fix reference-style links: [title][tag](url) -> [tag] [title](url)
      content = fixReferenceLinks(content);

      // Inject tags into source URLs
      if (report.sourceItems && report.sourceItems.length > 0) {
        content = this.injectTagsToSources(content, report.sourceItems);
      }

      // Fix again after injectTagsToSources (it may create [title][tag](url) again)
      content = fixReferenceLinks(content);

      lines.push(content);
      lines.push('');

      return lines.join('\n');
    }

    // Fallback: structured format
    lines.push('## 分析报告');
    lines.push('');

    for (const analysis of report.analyses) {
      lines.push(`### ${this.getCategoryTitle(analysis.category)}`);
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
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Inject tags into source URLs in markdown content
   * Transforms: [Source Name](URL) -> [Source Name][tag1][tag2](URL)
   */
  private injectTagsToSources(content: string, sourceItems: NewsItem[]): string {
    // Build URL -> tags mapping
    const urlTagMap = new Map<string, string>();
    for (const item of sourceItems) {
      if (item.tags) {
        const tagStr = tagsToString(item.tags);
        if (tagStr) {
          urlTagMap.set(item.url, tagStr);
        }
      }
    }

    // Replace pattern: [Source Name](URL) -> [Source Name][TAG](URL)
    const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
    return content.replace(regex, (match, sourceName, url) => {
      const tagStr = urlTagMap.get(url);
      if (tagStr) {
        // Insert tags after source name, keep the original link
        return `[${sourceName}]${tagStr}(${url})`;
      }
      return match;
    });
  }

  /**
   * Get category title in Chinese
   */
  private getCategoryTitle(category: string): string {
    const titles: Record<string, string> = {
      macro_finance: '🌍 主题一：宏观金融与大类资产',
      industry: '🏭 主题二：行业中观',
      geopolitics: '🌍 主题三：地缘政治',
    };
    return titles[category] || category;
  }

  /**
   * Save report to local file
   */
  async save(report: MacroReport): Promise<StorageMetadata> {
    const filename = this.generateFilename(report.generatedAt);
    const filePath = path.join(this.outputDir, filename);
    const content = this.formatAsMarkdown(report);

    try {
      fs.writeFileSync(filePath, content, 'utf-8');
      const stats = fs.statSync(filePath);

      logger.info(`Report saved to: ${filePath}`);

      return {
        filename,
        path: filePath,
        createdAt: report.generatedAt,
        size: stats.size,
      };
    } catch (error) {
      logger.error(`Failed to save report: ${error}`);
      throw error;
    }
  }

  /**
   * Read a report from file
   */
  async read(filename: string): Promise<string> {
    const filePath = path.join(this.outputDir, filename);

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    return fs.readFileSync(filePath, 'utf-8');
  }

  /**
   * List all stored reports
   */
  async listReports(): Promise<StorageMetadata[]> {
    this.ensureDirectory();
    const files = fs.readdirSync(this.outputDir);
    const reports: StorageMetadata[] = [];

    for (const file of files) {
      if (file.endsWith('.md')) {
        const filePath = path.join(this.outputDir, file);
        const stats = fs.statSync(filePath);

        reports.push({
          filename: file,
          path: filePath,
          createdAt: stats.mtime,
          size: stats.size,
        });
      }
    }

    // Sort by creation date (newest first)
    reports.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return reports;
  }

  /**
   * Get the output directory path
   */
  getOutputDir(): string {
    return this.outputDir;
  }
}

/**
 * Factory function to create markdown storage
 */
export function createMarkdownStorage(config?: MarkdownStorageConfig): MarkdownStorage {
  return new MarkdownStorage(config);
}
