/**
 * Scheduler Module
 * Manages cron-based scheduled tasks
 * Uses native setInterval with cron parsing
 */

import { logger } from './utils/logger';
import { ScheduledTask as TaskDefinition } from './types';

/**
 * Scheduler class
 * Manages scheduled execution of tasks using native setInterval
 */
export class Scheduler {
  private tasks: Array<{
    definition: TaskDefinition;
    interval: NodeJS.Timeout;
  }> = [];
  private timezone: string;
  private isRunning: boolean = false;

  constructor(timezone: string = 'Asia/Shanghai') {
    this.timezone = timezone;
  }

  /**
   * Add a scheduled task
   */
  addTask(definition: TaskDefinition): void {
    // Use process.stdout.write for unbuffered output in Docker
    const log = (msg: string) => {
      process.stdout.write(msg + '\n');
    };

    log(`[CRON] Adding task: ${definition.name} with schedule: ${definition.cronExpression}`);
    logger.info(`[CRON] Adding task: ${definition.name} with schedule: ${definition.cronExpression}`);

    // Check function - determines if task should run now
    const shouldRun = (): boolean => {
      const now = new Date();
      const minute = now.getMinutes();
      const hour = now.getHours();
      const dayOfWeek = now.getDay();

      // Parse cron expression
      const parts = definition.cronExpression.trim().split(/\s+/);
      if (parts.length < 5) {
        log(`[CRON] Invalid cron expression: ${definition.cronExpression}`);
        return false;
      }

      const cronMin = parts[0];
      const cronHour = parts[1];
      const cronDayOfWeek = parts[4];

      // Check minute
      if (cronMin !== '*') {
        const mins = this.parseCronField(cronMin);
        if (!mins.includes(minute)) return false;
      }

      // Check hour
      if (cronHour !== '*') {
        const hours = this.parseCronField(cronHour);
        if (!hours.includes(hour)) return false;
      }

      // Check day of week
      if (cronDayOfWeek !== '*') {
        const days = this.parseCronField(cronDayOfWeek);
        if (!days.includes(dayOfWeek)) return false;
      }

      return true;
    };

    // Handler function
    const handler = async () => {
      if (!shouldRun()) return;

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
    };

    // Run immediately on start, then every minute
    handler();
    const interval = setInterval(() => {
      process.stdout.write(`[CRON] TIMER FIRED: ${definition.name} at ${new Date().toISOString()}\n`);
      handler();
    }, 60000);

    this.tasks.push({
      definition,
      interval,
    });

    log(`[CRON] Task scheduled successfully: ${definition.name} (${definition.cronExpression})`);
    logger.info(`Task scheduled successfully: ${definition.name} (${definition.cronExpression})`);
  }

  /**
   * Parse cron field (e.g., "1-5" -> [1,2,3,4,5], "0,30" -> [0,30])
   */
  private parseCronField(field: string): number[] {
    const result: number[] = [];
    const parts = field.split(',');

    for (const part of parts) {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(Number);
        for (let i = start; i <= end; i++) {
          result.push(i);
        }
      } else {
        result.push(parseInt(part, 10));
      }
    }

    return result;
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
      clearInterval(task.interval);
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
 * 00:00 - Weekly report (every Monday)
 * 06:00 - Daily deep report (weekdays)
 * 09:00 - Pre-market analysis (weekdays)
 * 12:30 - Mid-day review (weekdays)
 * 21:00 - Evening/overseas preview (weekdays)
 */
export const DEFAULT_SCHEDULE = {
  weekly: '0 0 * * 1',        // 00:00 Monday
  daily: '0 6 * * 1-5',      // 06:00 Beijing, weekdays
  preMarket: '0 9 * * 1-5',  // 09:00 Beijing, weekdays
  midDay: '30 12 * * 1-5',   // 12:30 Beijing, weekdays
  evening: '0 21 * * 1-5',   // 21:00 Beijing, weekdays
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
  const parts = expression.trim().split(/\s+/);
  return parts.length === 5;
}
