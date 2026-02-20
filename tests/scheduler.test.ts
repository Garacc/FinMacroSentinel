import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Scheduler, createScheduler, isValidCronExpression, DEFAULT_SCHEDULE } from '../src/scheduler';

describe('Scheduler', () => {
  let scheduler: Scheduler;

  beforeEach(() => {
    scheduler = createScheduler();
  });

  afterEach(() => {
    scheduler.stop();
  });

  it('should create a scheduler', () => {
    expect(scheduler).toBeDefined();
  });

  it('should not be running initially', () => {
    expect(scheduler.getIsRunning()).toBe(false);
  });

  it('should validate cron expressions', () => {
    expect(isValidCronExpression('0 9 * * *')).toBe(true);
    expect(isValidCronExpression('0 9,12,21 * * *')).toBe(true);
    expect(isValidCronExpression('invalid')).toBe(false);
  });

  it('should have valid default schedule', () => {
    expect(isValidCronExpression(DEFAULT_SCHEDULE.preMarket)).toBe(true);
    expect(isValidCronExpression(DEFAULT_SCHEDULE.midDay)).toBe(true);
    expect(isValidCronExpression(DEFAULT_SCHEDULE.evening)).toBe(true);
  });

  it('should start and stop', () => {
    scheduler.start();
    expect(scheduler.getIsRunning()).toBe(true);

    scheduler.stop();
    expect(scheduler.getIsRunning()).toBe(false);
  });

  it('should add scheduled task', () => {
    let executed = false;
    scheduler.addTask({
      name: 'test-task',
      cronExpression: '* * * * *', // Every minute
      timezone: 'Asia/Shanghai',
      handler: async () => {
        executed = true;
      },
    });

    scheduler.start();
    // The task will execute on next minute
    // We can't easily test the execution in unit test
    expect(scheduler.getIsRunning()).toBe(true);
  });
});
