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
 * Expand cron field (e.g., "1-5" -> [1,2,3,4,5], "0,9,21" -> [0,9,21], "*" -> [0-59])
 */
function expandCronField(field: string): number[] {
  // Handle wildcard - return all possible values (0-59 for minutes/hours, 0-6 for days)
  if (field === '*') {
    return [];
  }

  const result: number[] = [];
  const parts = field.split(',');
  for (const part of parts) {
    if (part.includes('-')) {
      const [start, end] = part.split('-').map(Number);
      for (let i = start; i <= end; i++) {
        result.push(i);
      }
    } else {
      result.push(parseInt(part));
    }
  }
  return result;
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
    // Use both console.log and logger to ensure visibility in Docker
    console.log(`[CRON] Adding task: ${definition.name} with schedule: ${definition.cronExpression}`);
    logger.info(`[CRON] Adding task: ${definition.name} with schedule: ${definition.cronExpression}`);

    // Use setTimeout-based approach as a fallback
    const checkAndRun = () => {
      try {
        // Server is already in Beijing timezone (TZ=Asia/Shanghai in Dockerfile)
        // So just use local time directly
        const now = new Date();
        const minute = now.getMinutes();
        const hour = now.getHours();
        const dayOfWeek = now.getDay();

        // Always use console.log for check - this will show in Docker
        // Format time properly
        const localTimeStr = now.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false });
        console.log(`[CRON] CHECK: ${definition.name} | 北京时间=${localTimeStr} | min=${minute} hour=${hour} dow=${dayOfWeek} | cron=${definition.cronExpression}`);

        // Simple cron parsing for our specific patterns (5 fields: min hour day month dayOfWeek)
        const parts = definition.cronExpression.trim().split(/\s+/);
        const cronMin = parts[0];
        const cronHour = parts[1];
        const cronDay = parts[4] || '*';
        const targetMins = expandCronField(cronMin);
        const targetHours = expandCronField(cronHour);
        const targetDays = expandCronField(cronDay);

        console.log(`[CRON] PARSE: targetMins=${JSON.stringify(targetMins)} targetHours=${JSON.stringify(targetHours)} targetDays=${JSON.stringify(targetDays)}`);

        // Wildcard (*) means match any value (empty array)
        const dayMatches = targetDays.length === 0 || targetDays.includes(dayOfWeek);
        const hourMatches = targetHours.length === 0 || targetHours.includes(hour);
        const minMatches = targetMins.length === 0 || targetMins.includes(minute);

        console.log(`[CRON] MATCH: day=${dayMatches} hour=${hourMatches} min=${minMatches} => ${dayMatches && hourMatches && minMatches ? 'EXECUTE' : 'skip'}`);

        if (dayMatches && hourMatches && minMatches) {
          console.log(`[CRON] EXECUTING: ${definition.name}`);
          logger.info(`[CRON] Executing scheduled task: ${definition.name}`);
          definition.handler().then(() => {
            console.log(`[CRON] COMPLETED: ${definition.name}`);
            logger.info(`[CRON] Task completed: ${definition.name}`);
          }).catch((error) => {
            console.log(`[CRON] FAILED: ${definition.name} - ${error}`);
            logger.error(`[CRON] Task failed: ${definition.name}`, error);
          });
        }
      } catch (err) {
        console.log(`[CRON] ERROR: ${definition.name} - ${err}`);
        logger.error(`[CRON] Error in ${definition.name}:`, err);
      }
    };

    // Check every minute
    const interval = setInterval(checkAndRun, 60000);
    checkAndRun(); // Run immediately on start

    this.tasks.push(interval as unknown as ScheduledTask);
    console.log(`[CRON] Task scheduled successfully: ${definition.name} (${definition.cronExpression})`);
    logger.info(`Task scheduled successfully: ${definition.name} (${definition.cronExpression})`);
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
    const parts = cronExpr.split(' ');
    if (parts.length >= 5) {
      const [, hours, minutes] = parts;
      const hourList = hours.split(',').map(Number);
      const minuteList = minutes ? minutes.split(',').map(Number) : [0];

      // Find the next valid run times
      let current = new Date(now);
      current.setSeconds(0, 0);

      while (runs.length < count) {
        // Move to next hour
        current = new Date(current.getTime() + 60 * 60 * 1000);

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

        // If no more runs today, move to tomorrow
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
  midDay: '0 12 * * 1-5',    // 12:30 Beijing, weekdays
  evening: '0 21 * * 1-5',   // 21:00 Beijing, weekdays
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
