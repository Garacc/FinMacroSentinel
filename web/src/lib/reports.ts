import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const reportsDirectory = path.join(process.cwd(), 'output');

export interface ReportMeta {
  id: string;
  title: string;
  date: string;
  time: string;
  generatedTime: string;
  summary: string; // 首席风控官寄语
  tags: string[]; // 分类标签
}

/**
 * 从 md 内容中提取分类标签（如 [宏观]、[商品]、[地缘] 等）
 * 从信源溯源部分的 [...] 标记中提取
 */
function extractTags(content: string): string[] {
  // 匹配 [...] 格式的标签，排除 URL 和特定模式
  const tagRegex = /\[([^\]]+)\]/g;
  const tags = new Set<string>();
  let match;

  while ((match = tagRegex.exec(content)) !== null) {
    const tag = match[1].trim();
    // 过滤掉非标签内容（URL、标题等）
    if (
      tag &&
      !tag.includes('：') &&
      !tag.includes(':') &&
      !tag.startsWith('http') &&
      !tag.includes('.com') &&
      !tag.includes('.cn') &&
      !tag.includes('【') &&
      !tag.includes('】') &&
      tag.length < 10
    ) {
      tags.add(tag);
    }
  }

  // 返回最多6个标签
  return Array.from(tags).slice(0, 6);
}

/**
 * 从 md 内容中提取标题（第1行）和摘要（最后一段首席风控官寄语）
 */
function extractTitleAndSummary(content: string): { title: string; summary: string } {
  const lines = content.split('\n').filter(line => line.trim());

  // 第1行作为标题
  const title = lines[0]?.replace(/^#\s*/, '').trim() || '';

  // 查找首席风控官寄语（以 *💡 首席风控官寄语：* 开头）
  let summary = '';
  const summaryLine = lines.find(line => line.includes('首席风控官寄语'));
  if (summaryLine) {
    summary = summaryLine
      .replace(/^\*💡\s*首席风控官寄语：\s*/, '')
      .replace(/\*$/, '')
      .trim();
  }

  return { title, summary };
}

export function getAllReports(): ReportMeta[] {
  // 确保目录存在
  if (!fs.existsSync(reportsDirectory)) {
    return [];
  }

  const fileNames = fs.readdirSync(reportsDirectory);
  const reports = fileNames
    .filter((fileName) => fileName.endsWith('.md'))
    .map((fileName) => {
      const id = fileName.replace(/\.md$/, '');
      const fullPath = path.join(reportsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { data, content } = matter(fileContents);

      // 提取标题和摘要（首席风控官寄语）
      const { title, summary } = extractTitleAndSummary(content);

      // 提取分类标签
      const tags = extractTags(content);

      // 从文件名提取日期和时间 (格式: YYYYMMDDHH)
      const date = id.substring(0, 8);
      const time = id.substring(8, 10);

      // 格式化日期
      const formattedDate = `${date.substring(0, 4)}/${date.substring(4, 6)}/${date.substring(6, 8)}`;
      const formattedTime = `${time}:00`;

      return {
        id,
        title: title || data.title || `报告 ${formattedDate} ${formattedTime}`,
        date: formattedDate,
        time: formattedTime,
        generatedTime: data.generatedTime || '',
        summary: summary,
        tags: tags,
      };
    })
    .sort((a, b) => {
      // 按日期倒序排列，最新的在前
      return b.id.localeCompare(a.id);
    });

  return reports;
}

export function getReportById(id: string): { meta: ReportMeta; content: string } | null {
  const fullPath = path.join(reportsDirectory, `${id}.md`);

  if (!fs.existsSync(fullPath)) {
    return null;
  }

  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);

  // 提取标题和摘要（首席风控官寄语）
  const { title, summary } = extractTitleAndSummary(content);

  // 提取分类标签
  const tags = extractTags(content);

  // 跳过前4行（标题、空白行、生成时间、空白行），从第5行开始
  const contentLines = content.split('\n');
  const filteredContent = contentLines.slice(4).join('\n');

  // 从文件名提取日期和时间
  const date = id.substring(0, 8);
  const time = id.substring(8, 10);
  const formattedDate = `${date.substring(0, 4)}/${date.substring(4, 6)}/${date.substring(6, 8)}`;
  const formattedTime = `${time}:00`;

  const meta: ReportMeta = {
    id,
    title: title || data.title || `报告 ${formattedDate} ${formattedTime}`,
    date: formattedDate,
    time: formattedTime,
    generatedTime: data.generatedTime || '',
    summary: summary,
    tags: tags,
  };

  return { meta, content: filteredContent };
}
