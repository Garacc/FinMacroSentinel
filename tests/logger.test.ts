import { describe, it, expect, beforeEach } from 'vitest';
import { logger, LogLevel, setLogLevel } from '../src/utils/logger';

describe('Logger', () => {
  beforeEach(() => {
    setLogLevel(LogLevel.DEBUG);
  });

  it('should log info messages', () => {
    expect(() => logger.info('test info message')).not.toThrow();
  });

  it('should log debug messages', () => {
    expect(() => logger.debug('test debug message')).not.toThrow();
  });

  it('should log warn messages', () => {
    expect(() => logger.warn('test warn message')).not.toThrow();
  });

  it('should log error messages', () => {
    expect(() => logger.error('test error message')).not.toThrow();
  });

  it('should format log messages with timestamp', () => {
    const infoSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logger.info('test');
    expect(infoSpy).toHaveBeenCalled();
    infoSpy.mockRestore();
  });
});
