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
import { getDatabase } from './storage/db';
import { generateDailyReport } from './analyzer/dailyReport';
import { generateWeeklyReport } from './analyzer/weeklyReport';
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
    // Initialize database (for news persistence)
    const db = getDatabase();

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

    // Step 1: Analyze news
    logger.info('Step 1: Analyzing financial news...');
    const report = await analyzer.analyze(timePeriod);

    // Step 1.5: Save collected news to database (for persistence)
    if (report.sourceItems && report.sourceItems.length > 0) {
      logger.info(`Step 1.5: Persisting ${report.sourceItems.length} news items to database...`);
      const savedCount = db.saveNewsBatch(report.sourceItems);
      logger.info(`Saved ${savedCount} news items to database`);
    }

    // Step 2: Save to local storage
    const feishuClient = new FeishuClient({
      appId: config.feishu.appId,
      appSecret: config.feishu.appSecret,
      chatId: config.feishu.chatId,
    });
    const cardBuilder = new CardBuilder();

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

  // Add weekly report task (Monday 00:00)
  scheduler.addTask({
    name: 'weekly-report',
    cronExpression: '0 0 * * 1',  // Every Monday at 00:00
    timezone: 'Asia/Shanghai',
    handler: async () => {
      logger.info('Running weekly macro report...');
      await generateWeeklyReport({ days: 7 });
    },
  });

  // Parse cron expression to extract hours for daily tasks
  const cronParts = config.scheduler.cronExpression.split(' ');
  const hours = cronParts[1].split(',');

  for (const hour of hours) {
    const hourNum = parseInt(hour, 10);

    if (hourNum === 6) {
      // Daily deep report at 6:00
      scheduler.addTask({
        name: 'daily-report',
        cronExpression: `0 ${hour} * * 1-5`,
        timezone: 'Asia/Shanghai',
        handler: async () => {
          logger.info('Running daily deep report...');
          await generateDailyReport({ hours: 24 });
        },
      });
    } else {
      // Regular pipeline for other times (9, 12, 21)
      scheduler.addTask({
        name: `pipeline-${hour}`,
        cronExpression: `0 ${hour} * * 1-5`,
        timezone: 'Asia/Shanghai',
        handler: () => runPipeline(),
      });
    }
  }

  scheduler.start();

  // Log next scheduled runs
  const nextRuns = scheduler.getNextRuns(5);
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
 * Parse report type from args
 */
function getReportType(args: string[]): string | undefined {
  const typeIndex = args.findIndex(arg => arg === '--report' || arg === '-r');
  if (typeIndex !== -1 && args[typeIndex + 1]) {
    const value = args[typeIndex + 1].toLowerCase();
    if (['daily', 'weekly'].includes(value)) {
      return value;
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
  const reportType = getReportType(args);

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

  // Handle special report types (daily, weekly)
  if (reportType === 'daily') {
    logger.info('Generating daily deep report...');
    try {
      const report = await generateDailyReport({ hours: 24 });
      logger.info('Daily report generated successfully');
    } catch (error) {
      logger.error('Failed to generate daily report:', error);
      process.exit(1);
    }
    return;
  }

  if (reportType === 'weekly') {
    logger.info('Generating weekly macro report...');
    try {
      const report = await generateWeeklyReport({ days: 7 });
      logger.info('Weekly report generated successfully');
    } catch (error) {
      logger.error('Failed to generate weekly report:', error);
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
