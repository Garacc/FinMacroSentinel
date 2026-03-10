/**
 * Scheduler Module
 * Manages cron-based scheduled tasks
 * Uses node-cron with Beijing timezone
 */

import cron from 'node-cron';
import { logger } from './utils/logger';
import { ScheduledTask as TaskDefinition } from './types';

/**
 * Scheduler class
 * Manages scheduled execution of tasks
 */
export class Scheduler {
  private tasks: cron.ScheduledTask[] = [];
  private timezone: string;
  private isRunning: boolean = false;

  constructor(timezone: string = 'Asia/Shanghai') {
    this.timezone = timezone;
  }

  /**
   * Add a scheduled task
   */
  addTask(definition: TaskDefinition): void {
    // Use process.stderr.write for unbuffered output in Docker
    const log = (msg: string) => {
      process.stderr.write(msg + '\n');
    };

    log(`[CRON] Adding task: ${definition.name} with schedule: ${definition.cronExpression}`);
    logger.info(`[CRON] Adding task: ${definition.name} with schedule: ${definition.cronExpression}`);

    // Validate cron expression
    if (!cron.validate(definition.cronExpression)) {
      log(`[CRON] Invalid cron expression: ${definition.cronExpression}`);
      logger.error(`Invalid cron expression: ${definition.cronExpression}`);
      return;
    }

    // Create cron task with timezone
    const task = cron.schedule(definition.cronExpression, async () => {
      const now = new Date();
      const localTimeStr = now.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false });

      log(`[CRON] EXECUTING: ${definition.name} at ${localTimeStr}`);
      logger.info(`[CRON] Executing scheduled task: ${definition.name}`);

      try {
        await definition.handler();
        log(`[CRON] COMPLETED: ${definition.name}`);
        logger.info(`[CRON] Task completed: ${definition.name}`);
      } catch (error) {
        log(`[CRON] FAILED: ${definition.name} - ${error}`);
        logger.error(`[CRON] Task failed: ${definition.name}`, error);
      }
    }, {
      timezone: this.timezone,
    });

    // Run immediately on start (optional - remove if not needed)
    log(`[CRON] Task scheduled successfully: ${definition.name} (${definition.cronExpression})`);
    logger.info(`Task scheduled successfully: ${definition.name} (${definition.cronExpression})`);

    this.tasks.push(task);
  }

  /**
   * Create a one-time task that runs now
   */
  async runOnce(handler: () => Promise<void>): Promise<void> {
    logger.info('Running one-time task...');
    try {
      await handler();
      logger.info('One-time task completed');
    } catch (error) {
      logger.error('One-time task failed:', error);
      throw error;
    }
  }

  /**
   * Start all scheduled tasks
   */
  start(): void {
    if (this.isRunning) {
      logger.warn('Scheduler already running');
      return;
    }

    this.isRunning = true;
    logger.info('Scheduler started');
  }

  /**
   * Stop all scheduled tasks
   */
  stop(): void {
    for (const task of this.tasks) {
      task.stop();
    }
    this.tasks = [];
    this.isRunning = false;
    logger.info('Scheduler stopped');
  }

  /**
   * Check if scheduler is running
   */
  getIsRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Get next scheduled execution times
   */
  getNextRuns(count: number = 5, cronExpr: string = '0 9,12,21 * * *'): Date[] {
    const now = new Date();
    const runs: Date[] = [];

    const parts = cronExpr.split(' ');
    if (parts.length >= 5) {
      const [, hours, minutes] = parts;
      const hourList = hours.split(',').map(Number);
      const minuteList = minutes ? minutes.split(',').map(Number) : [0];

      let current = new Date(now);
      current.setSeconds(0, 0);

      while (runs.length < count) {
        current = new Date(current.getTime() + 60 * 1000);

        for (const hour of hourList) {
          if (runs.length >= count) break;

          current.setHours(hour);
          for (const minute of minuteList) {
            current.setMinutes(minute);

            if (current > now) {
              runs.push(new Date(current));
            }
          }
        }

        if (runs.length === 0 && current.getHours() >= Math.max(...hourList)) {
          current.setDate(current.getDate() + 1);
          current.setHours(0, 0, 0, 0);
        }
      }
    }

    return runs.slice(0, count);
  }
}

/**
 * Default scheduled times (Beijing timezone)
 */
export const DEFAULT_SCHEDULE = {
  weekly: '0 0 * * 1',
  daily: '0 6 * * 1-5',
  preMarket: '0 9 * * 1-5',
  midDay: '30 12 * * 1-5',
  evening: '0 21 * * 1-5',
};

/**
 * Factory function to create a scheduler
 */
export function createScheduler(config?: { timezone?: string }): Scheduler {
  return new Scheduler(config?.timezone);
}

/**
 * Validate cron expression
 */
export function isValidCronExpression(expression: string): boolean {
  return cron.validate(expression);
}
