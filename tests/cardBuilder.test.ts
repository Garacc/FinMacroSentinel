import { describe, it, expect, beforeEach } from 'vitest';
import { CardBuilder, createCardBuilder } from '../src/delivery/cardBuilder';
import { MacroReport, NewsCategory } from '../src/types';

describe('CardBuilder', () => {
  let builder: CardBuilder;

  beforeEach(() => {
    builder = createCardBuilder();
  });

  it('should create a card builder', () => {
    expect(builder).toBeDefined();
  });

  it('should build card for silence report', () => {
    const report: MacroReport = {
      title: 'Test Report',
      date: '2024-01-01',
      time: '09:00',
      analyses: [],
      isSilent: true,
      generatedAt: new Date(),
    };

    const card = builder.buildCard(report);
    expect(card.header.template).toBe('grey');
    expect(card.elements[0].text.content).toContain('信息静默');
  });

  it('should truncate long content', () => {
    const longContent = 'a'.repeat(10000);
    const truncated = builder.truncateContent(longContent, 100);
    expect(truncated.length).toBeLessThan(10500);
    expect(truncated).toContain('已截断');
  });

  it('should not truncate short content', () => {
    const shortContent = 'short content';
    const result = builder.truncateContent(shortContent, 100);
    expect(result).toBe(shortContent);
  });
});
