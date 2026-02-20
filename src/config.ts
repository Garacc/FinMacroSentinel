/**
 * Configuration management for FinMacroSentinel
 * Loads environment variables and provides typed configuration
 */

import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load .env file
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else if (fs.existsSync(path.resolve(process.cwd(), '.env.local'))) {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
}

export interface Config {
  anthropic: {
    apiEndpoint: string;
    model: string;
    apiKey: string;
  };
  feishu: {
    appId: string;
    appSecret: string;
    chatId: string;
  };
  storage: {
    outputDir: string;
  };
  scheduler: {
    cronExpression: string;
  };
}

function getRequiredEnv(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getOptionalEnv(key: string, defaultValue: string = ''): string {
  return process.env[key] || defaultValue;
}

export const config: Config = {
  anthropic: {
    apiEndpoint: getOptionalEnv('ANTHROPIC_API_ENDPOINT', '') || 'https://api.anthropic.com',
    model: getOptionalEnv('ANTHROPIC_MODEL', 'claude-3-5-sonnet-20241022') || 'claude-3-5-sonnet-20241022',
    apiKey: getRequiredEnv('ANTHROPIC_API_KEY'),
  },
  feishu: {
    appId: getOptionalEnv('FEISHU_APP_ID', ''),
    appSecret: getOptionalEnv('FEISHU_APP_SECRET', ''),
    chatId: getOptionalEnv('FEISHU_CHAT_ID', ''),
  },
  storage: {
    outputDir: getOptionalEnv('OUTPUT_DIR', './output') || './output',
  },
  scheduler: {
    cronExpression: getOptionalEnv('SCHEDULE_CRON', '0 9,12,21 * * *') || '0 9,12,21 * * *',
  },
};
