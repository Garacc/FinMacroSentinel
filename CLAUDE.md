# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FinMacroSentinel is an automated financial news analysis and investment decision support system. It collects macro financial news, analyzes them from a hedge fund manager's perspective, and pushes structured reports to a Feishu (飞书) chat group.

**Core Philosophy**: Facts separated from opinions; macro drives micro; risk-first; local data decoupled from remote display; strict source attribution.

## Architecture

The system follows a pipeline architecture:

```
[Time Trigger] → [Data Collection] → [AI Analysis] → [Local Storage] → [Feishu Push]
```

### Module Structure

- **Time & Trigger**: Cron-based scheduler running at 09:00, 12:30, 21:00 (Beijing UTC+8)
- **Content & Logic**: News采集 from sources (Bloomberg, Reuters, 华尔街见闻, etc.) → classified into 3 themes
- **Storage**: Local Markdown files named `YYYYMMDDHH.md` (e.g., `2026022009.md`)
- **Delivery**: Feishu Message Card via `/open-apis/im/v1/messages` API with `interactive` msg_type

## Implementation Requirements

### Environment

- Use `.env` for sensitive config (Feishu app credentials, API keys)
- Create `settings.local.json` for local-only settings (never commit)

### Feishu Integration

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

### AI Agent System Prompt

Must use this role and rules when calling LLM:
- Role: 20年经验的华尔街宏观对冲基金经理兼首席风控官
- Strict rules: No predictions (only "推演"), no single stock recommendations, mandatory risk/hedge warnings, mandatory URL sources, fact/opinion separation

### Output Format (Markdown)

```
🌍 主题一：宏观金融与大类资产
【核心事实】
- [客观总结]
- 信息来源：来源A / 来源B

【投资推演】
- 资产映射：[资产类别]
- 交易级别：[短期/中期/长期]
- 边界条件与风控：[风险提示]
```

## Commands (To Be Implemented)

Common commands for development:
- `npm install` - Install dependencies
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Run production server
- `npm test` - Run tests

## Key Files

- `PRD.md` - Full requirements specification
- `.env` - Environment variables (create from `.env.example`)
- `src/` - Source code directory
- `tests/` - Test files

## Fallback Rules

1. If no significant news: output "当前时段信息静默，无重大宏观异动" (never hallucinate)
2. If Feishu API fails: retry up to 3 times, log errors, then skip
3. If content exceeds Feishu card limit: compress, prioritize "投资推演" and "边界条件"
