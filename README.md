# FinMacroSentinel

自动化财经新闻分析与投资决策支持系统。

## 系统架构

```
[定时触发] → [数据采集] → [AI 分析] → [本地存储] → [飞书推送]
                                                    ↓
                                           [Web 前端查看]
```

## 功能特性

- **定时任务**: 每日 09:00、12:30、21:00 自动生成简报
- **AI 分析**: 基于 Claude 的宏观对冲基金经理视角分析
- **飞书推送**: 卡片消息推送到飞书群组
- **Web 前端**: 简洁优雅的报告查看界面
- **本地存储**: Markdown 格式持久化存储

## 快速开始

### Docker 部署（推荐）

```bash
# 1. 克隆项目
git clone https://github.com/Garacc/FinMacroSentinel.git
cd FinMacroSentinel

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 填入 API 密钥

# 3. 启动服务
docker-compose up -d

# 4. 访问 Web
http://localhost:3001
```

### 本地开发

```bash
# 后端
npm install
npm run dev

# Web 前端
cd web
npm install
npm run dev
```

## 配置说明

| 变量 | 说明 | 必需 |
|------|------|------|
| `ANTHROPIC_API_KEY` | Claude API 密钥 | ✅ |
| `FEISHU_APP_ID` | 飞书应用 ID | ✅ |
| `FEISHU_APP_SECRET` | 飞书应用密钥 | ✅ |
| `FEISHU_CHAT_ID` | 飞书群 ID | ✅ |
| `SCHEDULE_CRON` | 定时表达式 | 可选 |

详见 [DEPLOY.md](./DEPLOY.md)

## 技术栈

- **后端**: Node.js + TypeScript + Claude SDK
- **前端**: Next.js 16 + React 19 + Tailwind CSS 4
- **存储**: SQLite + Markdown
- **部署**: Docker + Docker Compose

## 项目结构

```
FinMacroSentinel/
├── src/
│   ├── collectors/    # 数据采集
│   ├── analyzer/     # AI 分析
│   ├── storage/      # 本地存储
│   ├── delivery/     # 飞书推送
│   ├── prompts/      # 系统提示词
│   ├── types/        # 类型定义
│   └── utils/        # 工具函数
├── web/              # Next.js 前端
├── output/           # 报告输出
├── Dockerfile        # 后端镜像
├── Dockerfile.web     # 前端镜像
└── docker-compose.yml
```

## License

MIT
