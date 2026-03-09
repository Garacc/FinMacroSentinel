/**
 * Scheduler Module
 * Manages cron-based scheduled tasks
 * Uses node-cron for reliable scheduling
 */

import cron, { ScheduledTask } from 'node-cron';
import { logger } from './utils/logger';
import { ScheduledTask as TaskDefinition } from './types';

/**
 * Scheduler class
 * Manages scheduled execution of tasks using node-cron
 */
export class Scheduler {
  private tasks: ScheduledTask[] = [];
  private timezone: string;
  private isRunning: boolean = false;

  constructor(timezone: string = 'Asia/Shanghai') {
    this.timezone = timezone;
  }

  /**
   * Add a scheduled task using node-cron
   */
  addTask(definition: TaskDefinition): void {
    // Validate cron expression
    if (!cron.validate(definition.cronExpression)) {
      logger.error(`Invalid cron expression: ${definition.cronExpression}`);
      return;
    }

    // Use timezone from task definition or fallback to scheduler default
    const tz = definition.timezone || this.timezone;
    logger.info(`[CRON] Adding task: ${definition.name} with schedule: ${definition.cronExpression}, timezone: ${tz}`);

    // Use node-cron for scheduling
    const task = cron.schedule(definition.cronExpression, async () => {
      const now = new Date();
      const localTimeStr = now.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false });

      process.stdout.write(`[CRON] EXECUTING: ${definition.name} at ${localTimeStr}\n`);
      logger.info(`[CRON] Executing scheduled task: ${definition.name}`);

      try {
        await definition.handler();
        process.stdout.write(`[CRON] COMPLETED: ${definition.name}\n`);
        logger.info(`[CRON] Task completed: ${definition.name}`);
      } catch (error) {
        process.stdout.write(`[CRON] FAILED: ${definition.name} - ${error}\n`);
        logger.error(`[CRON] Task failed: ${definition.name}`, error);
      }
    });

    this.tasks.push(task);
    logger.info(`[CRON] Task scheduled successfully: ${definition.name} (${definition.cronExpression})`);
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
    // Use node-cron's scheduledTasks to get next run times
    const tasks = cron.schedule(cronExpr, () => {}, {
      scheduled: false,
    });

    // node-cron doesn't expose next run times directly
    // Calculate manually
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
 * 00:00 - Weekly report (every Monday)
 * 06:00 - Daily deep report (weekdays)
 * 09:00 - Pre-market analysis (weekdays)
 * 12:30 - Mid-day review (weekdays)
 * 21:00 - Evening/overseas preview (weekdays)
 */
export const DEFAULT_SCHEDULE = {
  weekly: '0 0 * * 1',        // 00:00 Monday
  daily: '0 6 * * 1-5',       // 06:00 Beijing, weekdays
  preMarket: '0 9 * * 1-5',   // 09:00 Beijing, weekdays
  midDay: '30 12 * * 1-5',    // 12:30 Beijing, weekdays
  evening: '0 21 * * 1-5',    // 21:00 Beijing, weekdays
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
