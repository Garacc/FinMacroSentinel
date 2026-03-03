/**
 * Feishu Robot Client
 * Supports webhook-based robot push (no chat_id required)
 */

import axios from 'axios';
import { logger } from '../utils/logger';
import { FeishuCard } from '../types';

export interface FeishuRobotConfig {
  webhookUrl?: string;
}

/**
 * Feishu Robot Client class
 * Uses webhook URL for direct robot push
 */
export class FeishuRobotClient {
  private webhookUrl: string;

  constructor(config: FeishuRobotConfig = {}) {
    // Try to get webhook URL from environment
    this.webhookUrl = config.webhookUrl || process.env.FEISHU_WEBHOOK_URL || '';

    if (!this.webhookUrl) {
      logger.warn('Feishu webhook URL not configured');
    }
  }

  /**
   * Send a card message via webhook
   */
  async sendCard(card: FeishuCard): Promise<void> {
    if (!this.webhookUrl) {
      throw new Error('Feishu webhook URL not configured');
    }

    try {
      // Webhook uses a different format
      const payload: Record<string, unknown> = {
        msg_type: 'interactive',
        card: card,
      };

      logger.info('Sending card message via Feishu webhook...');

      const response = await axios.post(this.webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      if (response.data.code === 0 || response.data.status === 'success') {
        logger.info('Message sent successfully via webhook');
      } else {
        throw new Error(`Webhook error: ${JSON.stringify(response.data)}`);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Webhook request failed: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Send a text message via webhook
   */
  async sendText(text: string): Promise<void> {
    if (!this.webhookUrl) {
      throw new Error('Feishu webhook URL not configured');
    }

    try {
      const payload: Record<string, unknown> = {
        msg_type: 'text',
        content: JSON.stringify({ text }),
      };

      logger.info('Sending text message via Feishu webhook...');

      const response = await axios.post(this.webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      if (response.data.code === 0 || response.data.status === 'success') {
        logger.info('Message sent successfully via webhook');
      } else {
        throw new Error(`Webhook error: ${JSON.stringify(response.data)}`);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Webhook request failed: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Test the connection
   */
  async testConnection(): Promise<boolean> {
    if (!this.webhookUrl) {
      return false;
    }

    try {
      // Send a test message
      await this.sendText('🔔 FinMacroSentinel 测试消息 - 连接成功');
      return true;
    } catch (error) {
      logger.error('Feishu webhook test failed:', error);
      return false;
    }
  }
}

/**
 * Factory function to create a Feishu robot client
 */
export function createFeishuRobotClient(config?: FeishuRobotConfig): FeishuRobotClient {
  return new FeishuRobotClient(config);
}
