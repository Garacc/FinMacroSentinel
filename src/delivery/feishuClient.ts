/**
 * Feishu Client
 * Handles communication with Feishu Open API
 */

import axios, { AxiosInstance } from 'axios';
import { config as globalConfig } from '../config';
import { logger } from '../utils/logger';
import { FeishuCard } from '../types';

export interface FeishuClientConfig {
  appId?: string;
  appSecret?: string;
  chatId?: string;
  maxRetries?: number;
  retryDelay?: number;
  feishu?: {
    appId?: string;
    appSecret?: string;
    chatId?: string;
  };
}

/**
 * Feishu API error
 */
export class FeishuAPIError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'FeishuAPIError';
  }
}

/**
 * Token cache
 */
interface TokenCache {
  accessToken: string;
  expiresAt: number;
}

/**
 * Feishu Client class
 * Manages Feishu API authentication and messaging
 */
export class FeishuClient {
  private client: AxiosInstance;
  private appId: string;
  private appSecret: string;
  private chatId: string;
  private maxRetries: number;
  private retryDelay: number;
  private tokenCache: TokenCache | null = null;

  constructor(config: FeishuClientConfig = {}) {
    this.appId = config.appId || config.feishu?.appId || globalConfig.feishu.appId;
    this.appSecret = config.appSecret || config.feishu?.appSecret || globalConfig.feishu.appSecret;
    this.chatId = config.chatId || config.feishu?.chatId || globalConfig.feishu.chatId;
    this.maxRetries = config.maxRetries ?? 3;
    this.retryDelay = config.retryDelay ?? 1000;

    this.client = axios.create({
      baseURL: 'https://open.feishu.cn/open-apis',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Get access token using app credentials
   */
  async getAccessToken(): Promise<string> {
    // Check cache
    if (this.tokenCache && Date.now() < this.tokenCache.expiresAt) {
      return this.tokenCache.accessToken;
    }

    try {
      logger.info('Fetching Feishu access token...');

      const response = await this.client.post('/auth/v3/tenant_access_token/internal', {
        app_id: this.appId,
        app_secret: this.appSecret,
      });

      if (response.data.code === 0) {
        const accessToken = response.data.tenant_access_token;
        const expiresIn = response.data.expire - 60; // 60 seconds buffer

        this.tokenCache = {
          accessToken,
          expiresAt: Date.now() + expiresIn * 1000,
        };

        logger.info('Feishu access token obtained');
        return accessToken;
      } else {
        throw new FeishuAPIError(
          `Failed to get access token: ${response.data.msg}`,
          response.data.code?.toString()
        );
      }
    } catch (error) {
      if (error instanceof FeishuAPIError) {
        throw error;
      }
      throw new FeishuAPIError(
        `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Send a message to the chat
   */
  async sendMessage(card: FeishuCard, chatId?: string): Promise<void> {
    const targetChatId = chatId || this.chatId;
    const url = `/im/v1/messages`;

    // Build request payload
    const payload = {
      receive_id_type: 'chat_id',
      receive_id: targetChatId,
      msg_type: 'interactive',
      content: JSON.stringify(card),
    };

    // Retry logic
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const accessToken = await this.getAccessToken();

        logger.info(`Sending message to chat ${targetChatId} (attempt ${attempt})`);

        const response = await this.client.post(url, payload, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (response.data.code === 0) {
          logger.info('Message sent successfully');
          return;
        } else {
          throw new FeishuAPIError(
            `Failed to send message: ${response.data.msg}`,
            response.data.code?.toString(),
            response.status
          );
        }
      } catch (error) {
        lastError = error as Error;

        if (error instanceof FeishuAPIError) {
          // Handle specific error codes
          if (error.code === '99991663') {
            // Token expired, clear cache and retry
            this.tokenCache = null;
            logger.warn('Token expired, retrying with new token...');
            continue;
          }

          if (error.code === '99991642') {
            // Rate limited
            logger.warn('Rate limited, waiting before retry...');
            await this.sleep(this.retryDelay * 3);
            continue;
          }
        }

        if (attempt < this.maxRetries) {
          logger.warn(`Message send failed (attempt ${attempt}), retrying...`);
          await this.sleep(this.retryDelay * attempt);
        }
      }
    }

    // All retries failed
    throw lastError || new Error('Failed to send message after retries');
  }

  /**
   * Send a simple text message
   */
  async sendTextMessage(text: string, chatId?: string): Promise<void> {
    const targetChatId = chatId || this.chatId;
    const url = `/im/v1/messages`;

    const payload = {
      receive_id_type: 'chat_id',
      receive_id: targetChatId,
      msg_type: 'text',
      content: JSON.stringify({ text }),
    };

    const accessToken = await this.getAccessToken();

    await this.client.post(url, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Test the connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getAccessToken();
      return true;
    } catch (error) {
      logger.error('Feishu connection test failed:', error);
      return false;
    }
  }
}

/**
 * Factory function to create a Feishu client
 */
export function createFeishuClient(config?: FeishuClientConfig): FeishuClient {
  return new FeishuClient(config);
}
