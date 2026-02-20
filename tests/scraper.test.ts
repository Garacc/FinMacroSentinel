import { describe, it, expect, beforeEach } from 'vitest';
import { Scraper, DEFAULT_SOURCES, createScraper } from '../src/collectors/scraper';
import { NewsCategory } from '../src/types';

describe('Scraper', () => {
  let scraper: Scraper;

  beforeEach(() => {
    scraper = createScraper();
  });

  it('should create scraper with default sources', () => {
    expect(scraper).toBeDefined();
    expect(scraper.getSources().length).toBeGreaterThan(0);
  });

  it('should have correct default source structure', () => {
    const sources = scraper.getSources();
    for (const source of sources) {
      expect(source).toHaveProperty('name');
      expect(source).toHaveProperty('url');
      expect(source).toHaveProperty('category');
      expect(Object.values(NewsCategory)).toContain(source.category);
    }
  });

  it('should add new source', () => {
    const initialCount = scraper.getSources().length;
    scraper.addSource({
      name: 'Test Source',
      url: 'https://test.com',
      category: NewsCategory.MACRO_FINANCE,
    });
    expect(scraper.getSources().length).toBe(initialCount + 1);
  });
});
