# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**FinMacroSentinel** is an automated financial news analysis and investment decision support system. It collects macro financial news from multiple sources (Bloomberg, Reuters, 华尔街见闻, etc.), analyzes them from a hedge fund manager's perspective, and pushes structured reports to a Feishu (飞书) chat group.

**Core Philosophy**: Facts separated from opinions; macro drives micro; risk-first; local data decoupled from remote display; strict source attribution.

**Version**: 1.0.0

## Architecture

The system follows a pipeline architecture:

```
[Time Trigger] → [Data Collection] → [AI Analysis] → [Local Storage] → [Feishu Push]
```

### Module Structure

- **src/scheduler.ts** - Cron-based task scheduler
- **src/collectors/** - News data collection (web scraping, RSS, API)
- **src/analyzer/** - LLM-powered analysis engine
- **src/storage/** - Local Markdown file storage
- **src/delivery/** - Feishu message card delivery
- **src/prompts/** - System prompts for AI analysis
- **src/types/** - TypeScript type definitions
- **src/utils/** - Utility functions
- **src/config.ts** - Configuration management

### Data Flow

1. Scheduler triggers at 09:00, 12:30, 21:00 (Beijing UTC+8)
2. Collectors fetch news from multiple sources
3. Analyzer processes news using LLM with specific role prompt
4. Storage saves markdown files (YYYYMMDDHH.md format)
5. Delivery pushes to Feishu via API

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Run in development mode (ts-node)
npm run build        # Build for production
npm start            # Run production build
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
```

## Environment Configuration

- `.env` - Local environment variables (Feishu credentials, API keys)
- `.env.example` - Template for environment variables
- `settings.local.json` - Local-only settings (never commit)

### Required Environment Variables

```
FEISHU_APP_ID=
FEISHU_APP_SECRET=
FEISHU_CHAT_ID=
ANTHROPIC_API_KEY=
```

## AI Agent System Prompt

Must use this role and rules when calling LLM:

- **Role**: 20年经验的华尔街宏观对冲基金经理兼首席风控官
- **Strict Rules**:
  - No predictions (only "推演"), use institutional language
  - No single stock recommendations, only asset classes/ETFs
  - Mandatory risk/hedge warnings ("边界条件与风控")
  - Mandatory URL sources for all facts
  - Fact/opinion separation

## Output Format (Markdown)

```markdown
🌍 主题一：宏观金融与大类资产
【核心事实】
- [客观总结]
- 信息来源：来源A / 来源B

【投资推演】
- 资产映射：[资产类别]
- 交易级别：[短期/中期/长期]
- 边界条件与风控：[风险提示]
```

## Feishu Integration

Card JSON structure:
```json
{
  "config": { "wide_screen_mode": true },
  "header": {
    "title": { "tag": "plain_text", "content": "📈 FinMacroSentinel 财经时报" },
    "template": "blue"
  },
  "elements": [{ "tag": "div", "text": { "tag": "markdown", "content": "【Markdown内容】" } }]
}
```

API Endpoint: `POST /open-apis/im/v1/messages`
Msg Type: `interactive`

## Fallback Rules

1. **No significant news**: Output "当前时段信息静默，无重大宏观异动" (never hallucinate)
2. **Feishu API fails**: Retry up to 3 times, log errors, then skip
3. **Content exceeds limit**: Compress, prioritize "投资推演" and "边界条件"

## Key Files

- `PRD.md` - Full requirements specification
- `.env` - Environment variables (create from `.env.example`)
- `src/index.ts` - Main entry point
- `src/scheduler.ts` - Task scheduler
- `tests/` - Test files

## Dependencies

- **@anthropic-ai/sdk** - LLM API client
- **axios** - HTTP client
- **cheerio** - HTML parsing
- **node-cron** - Cron scheduler
- **playwright** - Browser automation

## Testing

- Framework: Vitest
- Run: `npm test`
- Watch mode: `npm run test:watch`

<!-- MEMORY:START -->
# FinMacroSentinel

_Last updated: 2026-02-21 | 0 active memories, 0 total_

_For deeper context, use memory_search, memory_related, or memory_ask tools._
<!-- MEMORY:END -->
