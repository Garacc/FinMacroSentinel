/**
 * FinMacroSentinel - Main Entry Point
 * Automated financial news analysis and investment decision support system
 */

import { config } from './config';
import { logger } from './utils/logger';
import { NewsCollector } from './collectors/newsCollector';
import { DataCleaner } from './collectors/dataCleaner';
import { ApiCollector } from './collectors/apiCollector';
import { LLMClient } from './analyzer/llmClient';
import { MacroAnalyzer } from './analyzer/macroAnalyzer';
import { MarkdownStorage } from './storage/markdownStorage';
import { FeishuClient } from './delivery/feishuClient';
import { CardBuilder } from './delivery/cardBuilder';
import { Scheduler, DEFAULT_SCHEDULE } from './scheduler';
import { isValidCronExpression } from './scheduler';
import { DATA_SOURCES, getEnabledSources, FRED_SERIES } from './config/dataSources';

export { config } from './config';
export { logger } from './utils/logger';
export { NewsCollector } from './collectors/newsCollector';
export { DataCleaner } from './collectors/dataCleaner';
export { ApiCollector } from './collectors/apiCollector';
export { LLMClient } from './analyzer/llmClient';
export { MacroAnalyzer } from './analyzer/macroAnalyzer';
export { MarkdownStorage } from './storage/markdownStorage';
export { FeishuClient } from './delivery/feishuClient';
export { CardBuilder } from './delivery/cardBuilder';
export { Scheduler } from './scheduler';
export { DATA_SOURCES, getEnabledSources, FRED_SERIES };

/**
 * Run the complete pipeline
 * @param options.dryRun - If true, skip Feishu delivery
 * @param options.timePeriod - Time period (morning/noon/night)
 * @param options.periodLabel - Display label for time period
 */
async function runPipeline(options: { dryRun?: boolean; timePeriod?: TimePeriod; periodLabel?: string } = {}): Promise<void> {
  const { dryRun = false, timePeriod, periodLabel } = options;

  logger.info('=== FinMacroSentinel Pipeline Starting ===');
  if (dryRun) {
    logger.info('[DRY RUN MODE] - Feishu delivery will be skipped');
  }
  if (timePeriod) {
    logger.info(`[TIME PERIOD] - ${periodLabel}`);
  }

  try {
    // Initialize components
    const newsCollector = new NewsCollector();
    const llmClient = new LLMClient({
      apiEndpoint: config.anthropic.apiEndpoint,
      model: config.anthropic.model,
      apiKey: config.anthropic.apiKey,
    });
    const analyzer = new MacroAnalyzer(newsCollector, llmClient);
    const storage = new MarkdownStorage({
      outputDir: config.storage.outputDir,
    });
    const feishuClient = new FeishuClient({
      appId: config.feishu.appId,
      appSecret: config.feishu.appSecret,
      chatId: config.feishu.chatId,
    });
    const cardBuilder = new CardBuilder();

    // Step 1: Analyze news
    logger.info('Step 1: Analyzing financial news...');
    const report = await analyzer.analyze(timePeriod);

    // Step 2: Save to local storage
    logger.info('Step 2: Saving report to local storage...');
    const metadata = await storage.save(report);
    logger.info(`Report saved: ${metadata.path}`);

    // Step 3: Send to Feishu (if configured and not dry run)
    if (dryRun) {
      logger.info('Step 3: Skipped (dry run mode)');
    } else {
      logger.info('Step 3: Sending to Feishu...');
      try {
        const card = cardBuilder.buildCard(report);
        await feishuClient.sendMessage(card);
        logger.info('Message sent to Feishu successfully');
      } catch (error) {
        logger.error('Failed to send to Feishu:', error);
        // Continue even if Feishu fails - we still have local storage
      }
    }

    logger.info('=== Pipeline Completed ===');
  } catch (error) {
    logger.error('Pipeline failed:', error);
    throw error;
  }
}

/**
 * Initialize and run in scheduled mode
 */
async function runScheduled(): Promise<void> {
  logger.info('Starting FinMacroSentinel in scheduled mode...');

  const scheduler = new Scheduler();

  // Add the main pipeline as a scheduled task
  scheduler.addTask({
    name: 'main-pipeline',
    cronExpression: config.scheduler.cronExpression,
    timezone: 'Asia/Shanghai',
    handler: runPipeline,
  });

  scheduler.start();

  // Log next scheduled runs
  const nextRuns = scheduler.getNextRuns(3);
  logger.info('Next scheduled runs:');
  nextRuns.forEach((date, i) => {
    logger.info(`  ${i + 1}. ${date.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`);
  });
}

/**
 * Initialize and run once (non-scheduled)
 */
async function runOnce(options: { dryRun?: boolean; timePeriod?: TimePeriod } = {}): Promise<void> {
  const { dryRun = false, timePeriod } = options;

  let periodLabel = '';
  if (timePeriod) {
    const labels: Record<TimePeriod, string> = {
      morning: '早盘预演',
      noon: '午间复盘',
      night: '夜盘前瞻',
    };
    periodLabel = labels[timePeriod];
    logger.info(`Running for time period: ${timePeriod} (${periodLabel})`);
  }

  logger.info('Starting FinMacroSentinel in one-time mode...');
  await runPipeline({ dryRun, timePeriod, periodLabel });
}

/**
 * Time period type
 */
type TimePeriod = 'morning' | 'noon' | 'night';

/**
 * Parse time period from args
 */
function getTimePeriod(args: string[]): TimePeriod | undefined {
  const typeIndex = args.findIndex(arg => arg === '--type' || arg === '-T');
  if (typeIndex !== -1 && args[typeIndex + 1]) {
    const value = args[typeIndex + 1].toLowerCase();
    if (['morning', 'noon', 'night'].includes(value)) {
      return value as TimePeriod;
    }
  }
  return undefined;
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const isScheduled = args.includes('--schedule') || args.includes('-s');
  const isTest = args.includes('--test') || args.includes('-t');
  const isDryRun = args.includes('--dry-run') || args.includes('-d');
  const timePeriod = getTimePeriod(args);

  // Validate configuration
  try {
    // Check required config
    if (!config.anthropic.apiKey) {
      throw new Error('ANTHROPIC_API_KEY is required');
    }
    if (!config.feishu.appId || !config.feishu.appSecret || !config.feishu.chatId) {
      logger.warn('Feishu configuration incomplete - will skip Feishu delivery');
    }
    if (!isValidCronExpression(config.scheduler.cronExpression)) {
      throw new Error(`Invalid cron expression: ${config.scheduler.cronExpression}`);
    }
  } catch (error) {
    logger.error('Configuration error:', error);
    process.exit(1);
  }

  if (isTest) {
    // Test mode - verify connections
    logger.info('Running in test mode...');
    try {
      const llmClient = new LLMClient();
      const analyzer = new MacroAnalyzer(new NewsCollector(), llmClient);
      const connected = await analyzer.testConnection();
      if (connected) {
        logger.info('✓ LLM connection test passed');
      } else {
        logger.error('✗ LLM connection test failed');
        process.exit(1);
      }
    } catch (error) {
      logger.error('Test failed:', error);
      process.exit(1);
    }
    return;
  }

  if (isScheduled) {
    await runScheduled();
  } else {
    await runOnce({ dryRun: isDryRun, timePeriod });
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    logger.error('Fatal error:', error);
    process.exit(1);
  });
}
