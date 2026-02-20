/**
 * Scheduler Module
 * Manages cron-based scheduled tasks
 * Supports Beijing timezone (UTC+8)
 */

import cron, { ScheduledTask } from 'node-cron';
import { logger } from './utils/logger';
import { ScheduledTask as TaskDefinition } from './types';

export interface SchedulerConfig {
  cronExpression?: string;
  timezone?: string;
  defaultCronExpression?: string;
}

/**
 * Scheduler class
 * Manages scheduled execution of tasks
 */
export class Scheduler {
  private tasks: ScheduledTask[] = [];
  private timezone: string;
  private isRunning: boolean = false;

  constructor(timezone: string = 'Asia/Shanghai') {
    this.timezone = timezone;
  }

  /**
   * Add a scheduled task
   */
  addTask(definition: TaskDefinition): void {
    const task = cron.schedule(definition.cronExpression, async () => {
      logger.info(`Executing scheduled task: ${definition.name}`);
      try {
        await definition.handler();
        logger.info(`Task completed: ${definition.name}`);
      } catch (error) {
        logger.error(`Task failed: ${definition.name}`, error);
      }
    }, {
      timezone: this.timezone,
    });

    this.tasks.push(task);
    logger.info(`Task scheduled: ${definition.name} (${definition.cronExpression})`);
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
    // This is a simplified implementation
    // In production, you might want more detailed scheduling info
    const now = new Date();
    const runs: Date[] = [];

    // Parse the cron expression to get next run times
    // This is a basic implementation
    const parts = cronExpr.split(' ');
    if (parts.length >= 5) {
      const [, hours] = parts;
      const hourList = hours.split(',').map(Number);

      for (let i = 0; i < count; i++) {
        const nextDate = new Date(now);
        nextDate.setDate(nextDate.getDate() + i + 1);
        nextDate.setHours(hourList[0], 0, 0, 0);
        runs.push(nextDate);
      }
    }

    return runs;
  }
}

/**
 * Default scheduled times (Beijing timezone)
 * 09:00 - Pre-market analysis
 * 12:30 - Mid-day review
 * 21:00 - Evening/overseas preview
 */
export const DEFAULT_SCHEDULE = {
  preMarket: '0 9 * * *',      // 09:00 Beijing
  midDay: '0 12 * * *',        // 12:30 Beijing
  evening: '0 21 * * *',       // 21:00 Beijing
};

/**
 * Factory function to create a scheduler
 */
export function createScheduler(config?: SchedulerConfig): Scheduler {
  return new Scheduler(config?.timezone);
}

/**
 * Validate cron expression
 */
export function isValidCronExpression(expression: string): boolean {
  return cron.validate(expression);
}
