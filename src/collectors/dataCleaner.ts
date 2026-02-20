/**
 * Data cleaner module for news items
 * Handles URL deduplication, content truncation, and news merging
 */

import { NewsItem, NewsCategory } from '../types';
import { logger } from '../utils/logger';

/**
 * Configuration for data cleaner
 */
export interface DataCleanerConfig {
  maxContentLength?: number;      // Max content characters (default: 2000)
  maxParagraphs?: number;          // Max paragraphs to keep (default: 3)
  enableDeduplication?: boolean;   // Enable URL deduplication
  enableMerging?: boolean;         // Enable news merging for similar items
  similarityThreshold?: number;    // Similarity threshold for merging (0-1)
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<DataCleanerConfig> = {
  maxContentLength: 2000,
  maxParagraphs: 3,
  enableDeduplication: true,
  enableMerging: true,
  similarityThreshold: 0.7,
};

/**
 * Data cleaner class
 */
export class DataCleaner {
  private config: Required<DataCleanerConfig>;

  constructor(config: DataCleanerConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Process news items through all cleaning steps
   */
  process(items: NewsItem[]): NewsItem[] {
    let processed = [...items];

    // Step 1: Truncate content
    processed = processed.map(item => this.truncateContent(item));

    // Step 2: Deduplicate by URL
    if (this.config.enableDeduplication) {
      processed = this.deduplicateByUrl(processed);
    }

    // Step 3: Merge similar news
    if (this.config.enableMerging) {
      processed = this.mergeSimilarNews(processed);
    }

    logger.info(`Data cleaner: ${items.length} -> ${processed.length} items`);
    return processed;
  }

  /**
   * Truncate content to max length and paragraphs
   */
  truncateContent(item: NewsItem): NewsItem {
    let { content } = item;

    // Split into paragraphs
    const paragraphs = content.split(/\n+/).filter(p => p.trim().length > 0);

    // Limit to maxParagraphs
    const limitedParagraphs = paragraphs.slice(0, this.config.maxParagraphs);
    let truncatedContent = limitedParagraphs.join('\n\n');

    // Also enforce max character limit
    if (truncatedContent.length > this.config.maxContentLength) {
      truncatedContent = truncatedContent.substring(0, this.config.maxContentLength) + '...';
    }

    return {
      ...item,
      content: truncatedContent,
    };
  }

  /**
   * Deduplicate news items by URL
   */
  deduplicateByUrl(items: NewsItem[]): NewsItem[] {
    const seenUrls = new Set<string>();
    const uniqueItems: NewsItem[] = [];

    for (const item of items) {
      // Normalize URL for comparison
      const normalizedUrl = this.normalizeUrl(item.url);

      if (!seenUrls.has(normalizedUrl)) {
        seenUrls.add(normalizedUrl);
        uniqueItems.push(item);
      }
    }

    if (uniqueItems.length < items.length) {
      logger.info(`Deduplicated: ${items.length} -> ${uniqueItems.length} items`);
    }

    return uniqueItems;
  }

  /**
   * Normalize URL for comparison
   */
  private normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      // Remove trailing slash and fragment
      return urlObj.origin + urlObj.pathname.replace(/\/$/, '');
    } catch {
      return url.toLowerCase();
    }
  }

  /**
   * Merge similar news items from different sources
   * Groups items that cover the same event
   */
  mergeSimilarNews(items: NewsItem[]): NewsItem[] {
    if (items.length <= 1) {
      return items;
    }

    const merged: NewsItem[] = [];
    const usedIndices = new Set<number>();

    for (let i = 0; i < items.length; i++) {
      if (usedIndices.has(i)) continue;

      const current = items[i];
      const similar: NewsItem[] = [current];
      usedIndices.add(i);

      // Find similar items
      for (let j = i + 1; j < items.length; j++) {
        if (usedIndices.has(j)) continue;

        const similarity = this.calculateSimilarity(current, items[j]);
        if (similarity >= this.config.similarityThreshold) {
          similar.push(items[j]);
          usedIndices.add(j);
        }
      }

      // Merge similar items
      if (similar.length > 1) {
        const mergedItem = this.mergeItems(similar);
        merged.push(mergedItem);
        logger.info(`Merged ${similar.length} similar items: ${current.title.substring(0, 50)}...`);
      } else {
        merged.push(current);
      }
    }

    return merged;
  }

  /**
   * Calculate similarity between two news items
   */
  private calculateSimilarity(item1: NewsItem, item2: NewsItem): number {
    // Check if same category
    if (item1.category !== item2.category) {
      return 0;
    }

    // Title similarity (Jaccard index on words)
    const titleSim = this.jaccardSimilarity(
      this.tokenize(item1.title),
      this.tokenize(item2.title)
    );

    // Check time difference (within 2 hours = likely same event)
    const timeDiff = Math.abs(item1.timestamp.getTime() - item2.timestamp.getTime());
    const timeSim = timeDiff < 2 * 60 * 60 * 1000 ? 0.3 : 0;

    // Content overlap
    const contentSim = this.jaccardSimilarity(
      this.tokenize(item1.content),
      this.tokenize(item2.content)
    );

    // Weighted average
    return titleSim * 0.5 + contentSim * 0.5 + timeSim;
  }

  /**
   * Tokenize text into words
   */
  private tokenize(text: string): Set<string> {
    // Extract words, numbers, and key terms
    const tokens = text
      .toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fa5]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 1);

    return new Set(tokens);
  }

  /**
   * Jaccard similarity between two sets
   */
  private jaccardSimilarity(set1: Set<string>, set2: Set<string>): number {
    if (set1.size === 0 || set2.size === 0) return 0;

    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
  }

  /**
   * Merge multiple similar news items
   */
  private mergeItems(items: NewsItem[]): NewsItem {
    // Sort by timestamp (newest first)
    const sorted = [...items].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Use the most recent item as base
    const base = sorted[0];

    // Collect all unique sources
    const sources = [...new Set(items.map(i => i.source))];

    // Create merged content - combine from multiple sources
    const contents = items.map(i => i.content).filter(c => c && c.length > 0);
    const mergedContent = this.mergeContent(contents);

    return {
      ...base,
      content: mergedContent,
      // Add source info in a way that won't break the interface
      source: sources.join(' / '),
    };
  }

  /**
   * Merge content from multiple sources
   * Prefers longer, more complete content
   */
  private mergeContent(contents: string[]): string {
    if (contents.length === 0) return '';
    if (contents.length === 1) return contents[0];

    // Find the longest content as base
    let base = contents.reduce((a, b) => (a.length > b.length ? a : b), '');

    // If contents are very different, prepend source attributions
    const uniqueContents = [...new Set(contents)];

    if (uniqueContents.length > 1) {
      const sourceNote = `\n\n[综合报道：${uniqueContents.length}个来源]`;
      base = base.substring(0, this.config.maxContentLength - sourceNote.length) + sourceNote;
    }

    return base;
  }

  /**
   * Filter items by category
   */
  filterByCategory(items: NewsItem[], category: NewsCategory): NewsItem[] {
    return items.filter(item => item.category === category);
  }

  /**
   * Filter items by source
   */
  filterBySource(items: NewsItem[], sourceNames: string[]): NewsItem[] {
    const sourceSet = new Set(sourceNames.map(s => s.toLowerCase()));
    return items.filter(item =>
      sourceSet.has(item.source.toLowerCase())
    );
  }

  /**
   * Sort items by timestamp (newest first)
   */
  sortByTimestamp(items: NewsItem[], ascending: boolean = false): NewsItem[] {
    return [...items].sort((a, b) => {
      const diff = a.timestamp.getTime() - b.timestamp.getTime();
      return ascending ? diff : -diff;
    });
  }

  /**
   * Get statistics about news items
   */
  getStatistics(items: NewsItem[]): {
    total: number;
    byCategory: Record<NewsCategory, number>;
    bySource: Record<string, number>;
    avgContentLength: number;
  } {
    const byCategory: Record<NewsCategory, number> = {
      [NewsCategory.MACRO_FINANCE]: 0,
      [NewsCategory.INDUSTRY]: 0,
      [NewsCategory.GEOPOLITICS]: 0,
    };

    const bySource: Record<string, number> = {};
    let totalContentLength = 0;

    for (const item of items) {
      byCategory[item.category]++;
      bySource[item.source] = (bySource[item.source] || 0) + 1;
      totalContentLength += item.content.length;
    }

    return {
      total: items.length,
      byCategory,
      bySource,
      avgContentLength: items.length > 0 ? Math.round(totalContentLength / items.length) : 0,
    };
  }
}

/**
 * Factory function to create a data cleaner
 */
export function createDataCleaner(config?: DataCleanerConfig): DataCleaner {
  return new DataCleaner(config);
}
