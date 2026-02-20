/**
 * Anthropic Claude API client for LLM calls
 * Supports custom API endpoints and model names
 */

import Anthropic from '@anthropic-ai/sdk';
import { config as globalConfig } from '../config';
import { logger } from '../utils/logger';
import { LLMAnalysisResult } from '../types';

export interface LLMClientConfig {
  apiEndpoint?: string;
  model?: string;
  apiKey?: string;
  maxTokens?: number;
  temperature?: number;
  anthropic?: {
    apiEndpoint?: string;
    model?: string;
    apiKey?: string;
  };
}

/**
 * LLM Client for calling Anthropic Claude API
 */
export class LLMClient {
  private client: Anthropic;
  private model: string;
  private maxTokens: number;
  private temperature: number;

  constructor(config: LLMClientConfig = {}) {
    const apiEndpoint = config.apiEndpoint || config.anthropic?.apiEndpoint || globalConfig.anthropic.apiEndpoint;
    const apiKey = config.apiKey || config.anthropic?.apiKey || globalConfig.anthropic.apiKey;
    this.model = config.model || config.anthropic?.model || globalConfig.anthropic.model || 'claude-3-5-sonnet-20241022';
    this.maxTokens = config.maxTokens || 4000;
    this.temperature = config.temperature || 0.7;

    // Initialize Anthropic client
    if (apiEndpoint && apiEndpoint !== 'https://api.anthropic.com') {
      // Use custom endpoint
      this.client = new Anthropic({
        apiKey,
        baseURL: apiEndpoint,
      });
    } else {
      this.client = new Anthropic({
        apiKey,
      });
    }

    logger.info(`LLM Client initialized with model: ${this.model}`);
  }

  /**
   * Send a message to the LLM
   */
  async sendMessage(
    system: string,
    user: string,
    options: Partial<LLMClientConfig> = {}
  ): Promise<LLMAnalysisResult> {
    const model = options.model || this.model;
    const maxTokens = options.maxTokens || this.maxTokens;
    const temperature = options.temperature ?? this.temperature;

    try {
      logger.info(`Sending message to LLM (model: ${model})`);

      const response = await this.client.messages.create({
        model,
        max_tokens: maxTokens,
        temperature,
        system,
        messages: [
          {
            role: 'user',
            content: user,
          },
        ],
      });

      // Extract text content from response
      const content = response.content
        .filter(block => block.type === 'text')
        .map(block => (block as Anthropic.TextBlock).text)
        .join('\n');

      logger.info(`LLM response received, length: ${content.length} chars`);

      return {
        content,
        isSilent: this.checkIfSilent(content),
      };
    } catch (error) {
      logger.error('LLM API call failed:', error);

      // Check for specific error types
      if (error instanceof Anthropic.APIError) {
        return {
          content: '',
          isSilent: true,
          error: `API Error: ${error.message}`,
        };
      }

      return {
        content: '',
        isSilent: true,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check if the response indicates silence (no significant news)
   */
  private checkIfSilent(content: string): boolean {
    const silenceIndicators = [
      '当前时段信息静默',
      '无重大宏观异动',
      '没有重大新闻',
      '暂无重要信息',
    ];

    return silenceIndicators.some(indicator =>
      content.toLowerCase().includes(indicator.toLowerCase())
    );
  }
}

/**
 * Factory function to create an LLM client
 */
export function createLLMClient(config?: LLMClientConfig): LLMClient {
  return new LLMClient({
    apiEndpoint: config?.apiEndpoint || config?.anthropic?.apiEndpoint || globalConfig.anthropic.apiEndpoint,
    model: config?.model || config?.anthropic?.model || globalConfig.anthropic.model,
    apiKey: config?.apiKey || config?.anthropic?.apiKey || globalConfig.anthropic.apiKey,
  });
}
