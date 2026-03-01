# FinMacroSentinel 部署指南

## 系统架构

| 服务 | 功能 | 端口 |
|------|------|------|
| finmacro-sentinel | 定时生成简报 + 飞书推送 | - |
| finmacro-web | Web 前端查看报告 | 3001 |

## 前置要求

- Docker >= 20.10
- Docker Compose >= 2.0

## 配置步骤

### 1. 准备环境变量

在项目根目录创建 `.env` 文件：

```bash
# Anthropic Claude API (必需)
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx

# 飞书配置 (二选一)

# 方式 A: 使用飞书应用 API
FEISHU_APP_ID=cli_xxxxx
FEISHU_APP_SECRET=xxxxx
FEISHU_CHAT_ID=oc_xxxxx

# 方式 B: 使用飞书机器人 Webhook
# FEISHU_WEBHOOK_URL=https://open.feishu.cn/open-apis/bot/v2/hook/xxxxx

# 定时任务 (可选，默认: 09:00, 12:30, 21:00)
# SCHEDULE_CRON=0 9,12,21 * * *
```

### 2. 启动 Docker 容器

```bash
# 构建并启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps
```

### 3. 验证服务

```bash
# 查看后端日志 (观察定时任务执行)
docker logs finmacro-sentinel -f

# 查看 Web 日志
docker logs finmacro-web - Web f

# 测试访问
curl http://localhost:3001
```

## 功能说明

### 定时任务

系统会按 cron 表达式定时执行简报生成：

| 时间 | 说明 |
|------|------|
| 09:00 | 早盘前瞻 |
| 12:30 | 午间复盘 |
| 21:00 | 夜盘前瞻 |

### 简报生成流程

1. **数据采集** - 从多个来源获取财经新闻
2. **AI 分析** - Claude 分析并生成投资建议
3. **本地存储** - 保存 Markdown 文件到 `output/` 目录
4. **飞书推送** -到指定 发送卡片消息群组

### Web 访问

简报生成后，可通过 Web 界面查看：

- **地址**: http://your-server-ip:3001
- **列表页**: 显示所有简报标题和摘要
- **详情页**: 查看完整简报内容

## 常用命令

```bash
# 重新构建镜像
docker-compose build --no-cache

# 重启服务
docker-compose restart

# 停止服务
docker-compose down

# 查看实时日志
docker-compose logs -f

# 查看特定服务日志
docker logs finmacro-sentinel -f --tail=100
```

## 数据持久化

| 目录 | 说明 |
|------|------|
| `./output` | 简报 Markdown 文件 |
| `./data` | SQLite 数据库 (如使用) |

这些目录会通过 volume 挂载到容器中，容器重启后数据不会丢失。

## 故障排查

### Web 无法访问

```bash
# 检查容器是否运行
docker ps

# 检查端口是否被占用
netstat -tlnp | grep 3001

# 查看 Web 容器日志
docker logs finmacro-web
```

### 简报未生成

```bash
# 检查后端容器是否运行
docker ps | grep finmacro-sentinel

# 查看后端日志
docker logs finmacro-sentinel

# 手动触发一次生成
docker exec finmacro-sentinel npm start
```

### 飞书推送失败

```bash
# 检查配置是否正确
docker exec finmacro-sentinel env | grep FEISHU

# 查看错误日志
docker logs finmacro-sentinel | grep -i feishu
```

## 目录结构

```
FinMacroSentinel/
├── Dockerfile           # 后端构建文件
├── Dockerfile.web       # Web 前端构建文件
├── docker-compose.yml   # 容器编排
├── .env                 # 环境变量 (需要创建)
├── output/              # 简报输出目录 (自动创建)
├── data/                # 数据目录 (自动创建)
└── src/                 # 源代码
```
