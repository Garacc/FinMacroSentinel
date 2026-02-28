/**
 * Database Module
 * SQLite-based storage for news and reports
 */

import BetterSqlite3 from 'better-sqlite3';
import path from 'path';
import { config as globalConfig } from '../config';
import { logger } from '../utils/logger';
import { NewsItem, NewsCategory } from '../types';

export interface DatabaseConfig {
  dbPath?: string;
}

export interface StoredNews {
  id: number;
  url: string;
  title: string;
  source: string;
  published_at: string | null;
  content: string | null;
  category: string | null;
  tags: string | null;
  created_at: string;
}

export interface StoredReport {
  id: number;
  type: string;
  title: string;
  content: string;
  generated_at: string;
}

/**
 * Database class for SQLite storage
 */
export class Database {
  private db: BetterSqlite3.Database;
  private dbPath: string;

  constructor(config: DatabaseConfig = {}) {
    const defaultPath = path.join(globalConfig.storage.outputDir || './output', 'finmacro.db');
    this.dbPath = config.dbPath || defaultPath;
    this.db = new BetterSqlite3(this.dbPath);
    this.db.pragma('journal_mode = WAL');
    this.initTables();
    logger.info(`Database initialized: ${this.dbPath}`);
  }

  /**
   * Initialize database tables
   */
  private initTables(): void {
    // News table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS news (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        source TEXT NOT NULL,
        published_at DATETIME,
        content TEXT,
        category TEXT,
        tags TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Reports table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        generated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_news_published_at ON news(published_at);
      CREATE INDEX IF NOT EXISTS idx_news_category ON news(category);
      CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(type);
      CREATE INDEX IF NOT EXISTS idx_reports_generated_at ON reports(generated_at);
    `);
  }

  /**
   * Insert or update news item
   */
  saveNews(item: NewsItem): number {
    const stmt = this.db.prepare(`
      INSERT INTO news (url, title, source, published_at, content, category, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(url) DO UPDATE SET
        title = excluded.title,
        source = excluded.source,
        published_at = excluded.published_at,
        content = excluded.content,
        category = excluded.category,
        tags = excluded.tags
    `);

    const tags = item.tags ? JSON.stringify(item.tags) : null;
    const result = stmt.run(
      item.url,
      item.title,
      item.source,
      item.timestamp?.toISOString() || null,
      item.content || null,
      item.category || null,
      tags
    );

    return result.lastInsertRowid as number;
  }

  /**
   * Save multiple news items
   */
  saveNewsBatch(items: NewsItem[]): number {
    const stmt = this.db.prepare(`
      INSERT INTO news (url, title, source, published_at, content, category, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(url) DO UPDATE SET
        title = excluded.title,
        source = excluded.source,
        published_at = excluded.published_at,
        content = excluded.content,
        category = excluded.category,
        tags = excluded.tags
    `);

    const insertMany = this.db.transaction((newsItems: NewsItem[]) => {
      for (const item of newsItems) {
        const tags = item.tags ? JSON.stringify(item.tags) : null;
        stmt.run(
          item.url,
          item.title,
          item.source,
          item.timestamp?.toISOString() || null,
          item.content || null,
          item.category || null,
          tags
        );
      }
      return newsItems.length;
    });

    return insertMany(items);
  }

  /**
   * Get news by URL
   */
  getNewsByUrl(url: string): StoredNews | undefined {
    const stmt = this.db.prepare('SELECT * FROM news WHERE url = ?');
    return stmt.get(url) as StoredNews | undefined;
  }

  /**
   * Get news by date range
   */
  getNewsByDateRange(startDate: Date, endDate: Date): StoredNews[] {
    const stmt = this.db.prepare(`
      SELECT * FROM news
      WHERE published_at BETWEEN ? AND ?
      ORDER BY published_at DESC
    `);
    return stmt.all(startDate.toISOString(), endDate.toISOString()) as StoredNews[];
  }

  /**
   * Get news by category
   */
  getNewsByCategory(category: NewsCategory, limit: number = 100): StoredNews[] {
    const stmt = this.db.prepare(`
      SELECT * FROM news
      WHERE category = ?
      ORDER BY published_at DESC
      LIMIT ?
    `);
    return stmt.all(category, limit) as StoredNews[];
  }

  /**
   * Get recent news
   */
  getRecentNews(hours: number = 24, limit: number = 100): StoredNews[] {
    const stmt = this.db.prepare(`
      SELECT * FROM news
      WHERE published_at >= datetime('now', '-' || ? || ' hours')
      ORDER BY published_at DESC
      LIMIT ?
    `);
    return stmt.all(hours, limit) as StoredNews[];
  }

  /**
   * Check if news exists by URL
   */
  hasNews(url: string): boolean {
    const stmt = this.db.prepare('SELECT 1 FROM news WHERE url = ?');
    return !!stmt.get(url);
  }

  /**
   * Save report
   */
  saveReport(type: string, title: string, content: string): number {
    const stmt = this.db.prepare(`
      INSERT INTO reports (type, title, content)
      VALUES (?, ?, ?)
    `);
    const result = stmt.run(type, title, content);
    return result.lastInsertRowid as number;
  }

  /**
   * Get reports by type
   */
  getReportsByType(type: string, limit: number = 10): StoredReport[] {
    const stmt = this.db.prepare(`
      SELECT * FROM reports
      WHERE type = ?
      ORDER BY generated_at DESC
      LIMIT ?
    `);
    return stmt.all(type, limit) as StoredReport[];
  }

  /**
   * Get latest report by type
   */
  getLatestReport(type: string): StoredReport | undefined {
    const stmt = this.db.prepare(`
      SELECT * FROM reports
      WHERE type = ?
      ORDER BY generated_at DESC
      LIMIT 1
    `);
    return stmt.get(type) as StoredReport | undefined;
  }

  /**
   * Get reports by date range
   */
  getReportsByDateRange(type: string, startDate: Date, endDate: Date): StoredReport[] {
    const stmt = this.db.prepare(`
      SELECT * FROM reports
      WHERE type = ? AND generated_at BETWEEN ? AND ?
      ORDER BY generated_at DESC
    `);
    return stmt.all(type, startDate.toISOString(), endDate.toISOString()) as StoredReport[];
  }

  /**
   * Get news count
   */
  getNewsCount(): number {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM news');
    const result = stmt.get() as { count: number };
    return result.count;
  }

  /**
   * Get report count by type
   */
  getReportCount(type: string): number {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM reports WHERE type = ?');
    const result = stmt.get(type) as { count: number };
    return result.count;
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
    logger.info('Database connection closed');
  }
}

/**
 * Factory function to create database instance
 */
export function createDatabase(config?: DatabaseConfig): Database {
  return new Database(config);
}

// Singleton instance
let dbInstance: Database | null = null;

/**
 * Get singleton database instance
 */
export function getDatabase(config?: DatabaseConfig): Database {
  if (!dbInstance) {
    dbInstance = new Database(config);
  }
  return dbInstance;
}
