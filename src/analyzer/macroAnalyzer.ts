/**
 * Macro Analyst - Core AI analysis module
 * Uses LLM to analyze financial news and generate investment insights
 */

import { LLMClient } from './llmClient';
import { NewsCollector, calculateTimeRange } from '../collectors/newsCollector';
import { SYSTEM_PROMPT, generateUserPrompt } from '../prompts/systemPrompt';
import { logger } from '../utils/logger';
import { RawNewsCollection, MacroReport, NewsCategory } from '../types';

/**
 * Macro Analyzer configuration
 */
export interface MacroAnalyzerConfig {
  enableRetry?: boolean;
  maxRetries?: number;
  silenceThreshold?: number;
}

/**
 * Macro Analyst class
 * Coordinates news collection and LLM analysis
 */
export class MacroAnalyzer {
  private newsCollector: NewsCollector;
  private llmClient: LLMClient;
  private config: Required<MacroAnalyzerConfig>;

  constructor(
    newsCollector: NewsCollector,
    llmClient: LLMClient,
    config: MacroAnalyzerConfig = {}
  ) {
    this.newsCollector = newsCollector;
    this.llmClient = llmClient;
    this.config = {
      enableRetry: config.enableRetry ?? true,
      maxRetries: config.maxRetries ?? 3,
      silenceThreshold: config.silenceThreshold ?? 3,
    };
  }

  /**
   * Run the complete analysis pipeline
   */
  async analyze(): Promise<MacroReport> {
    const now = new Date();
    const dateStr = now.toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' });
    const timeStr = now.toLocaleTimeString('zh-CN', {
      timeZone: 'Asia/Shanghai',
      hour: '2-digit',
      minute: '2-digit',
    });

    logger.info('Starting macro analysis pipeline...');

    // Step 1: Collect news (RSS feeds already provide recent news, no need for time filter)
    const collection = await this.newsCollector.collect();

    // Step 2: Check if there's significant news
    const hasSignificantNews = this.newsCollector.hasSignificantNews(collection);

    if (!hasSignificantNews) {
      logger.info('No significant news found, generating silence report');
      return {
        title: `📈 FinMacroSentinel 财经时报 - ${dateStr} ${timeStr}`,
        date: dateStr,
        time: timeStr,
        analyses: [],
        isSilent: true,
        generatedAt: now,
      };
    }

    // Step 3: Generate and send prompt to LLM
    const userPrompt = generateUserPrompt(collection);
    let result = await this.llmClient.sendMessage(SYSTEM_PROMPT, userPrompt);

    // Step 4: Handle retry if needed
    if (this.config.enableRetry && result.error) {
      for (let i = 0; i < this.config.maxRetries; i++) {
        logger.warn(`Retrying LLM call (attempt ${i + 2}/${this.config.maxRetries})`);
        result = await this.llmClient.sendMessage(SYSTEM_PROMPT, userPrompt);

        if (!result.error) {
          break;
        }

        // Wait before retrying (exponential backoff)
        await this.sleep(Math.pow(2, i) * 1000);
      }
    }

    // Step 5: Build the report
    const report: MacroReport = {
      title: `📈 FinMacroSentinel 财经时报 - ${dateStr} ${timeStr}`,
      date: dateStr,
      time: timeStr,
      analyses: [],
      isSilent: result.isSilent,
      generatedAt: now,
    };

    // If analysis succeeded, add content to report
    if (result.content && !result.isSilent) {
      logger.info('Analysis completed successfully');
      // Store raw content for card builder to format
      (report as unknown as Record<string, unknown>).rawContent = result.content;
    } else if (result.error) {
      logger.error('Analysis failed:', result.error);
      (report as unknown as Record<string, unknown>).error = result.error;
    }

    return report;
  }

  /**
   * Run a quick test to verify the pipeline works
   */
  async testConnection(): Promise<boolean> {
    try {
      logger.info('Testing LLM connection...');
      const testPrompt = '请用一句话回复：测试成功';
      const result = await this.llmClient.sendMessage(
        '你是一个简单的助手',
        testPrompt,
        { maxTokens: 100 }
      );

      if (result.error) {
        logger.error('LLM connection test failed:', result.error);
        return false;
      }

      logger.info('LLM connection test successful');
      return true;
    } catch (error) {
      logger.error('LLM connection test failed:', error);
      return false;
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Factory function to create a macro analyzer
 */
export function createMacroAnalyzer(
  newsCollector?: NewsCollector,
  llmClient?: LLMClient,
  config?: MacroAnalyzerConfig
): MacroAnalyzer {
  return new MacroAnalyzer(
    newsCollector || new NewsCollector(),
    llmClient || new LLMClient(),
    config
  );
}
