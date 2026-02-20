import { describe, it, expect, beforeEach } from 'vitest';
import { NewsCollector, createNewsCollector } from '../src/collectors/newsCollector';
import { NewsCategory, RawNewsCollection } from '../src/types';

describe('NewsCollector', () => {
  let collector: NewsCollector;

  beforeEach(() => {
    collector = createNewsCollector();
  });

  it('should create a news collector', () => {
    expect(collector).toBeDefined();
  });

  it('should generate silence message', () => {
    const silence = collector.generateSilenceMessage();
    expect(silence.items).toEqual([]);
    expect(silence.sourceCount).toBe(0);
    expect(silence.collectedAt).toBeInstanceOf(Date);
  });

  it('should identify significant news', () => {
    const collectionWithContent: RawNewsCollection = {
      items: [
        {
          title: 'Test',
          content: 'This is a significant news item with enough content to be considered important for analysis',
          url: 'https://test.com',
          source: 'Test',
          category: NewsCategory.MACRO_FINANCE,
          timestamp: new Date(),
        },
        {
          title: 'Test 2',
          content: 'Another important news item with substantial content for market analysis',
          url: 'https://test2.com',
          source: 'Test2',
          category: NewsCategory.MACRO_FINANCE,
          timestamp: new Date(),
        },
        {
          title: 'Test 3',
          content: 'Third significant news item with important economic data',
          url: 'https://test3.com',
          source: 'Test3',
          category: NewsCategory.INDUSTRY,
          timestamp: new Date(),
        },
      ],
      collectedAt: new Date(),
      sourceCount: 1,
    };

    expect(collector.hasSignificantNews(collectionWithContent)).toBe(true);
  });

  it('should identify lack of significant news', () => {
    const emptyCollection: RawNewsCollection = {
      items: [],
      collectedAt: new Date(),
      sourceCount: 0,
    };

    expect(collector.hasSignificantNews(emptyCollection)).toBe(false);
  });
});
