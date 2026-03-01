import { getReportById, getAllReports } from "@/lib/reports";
import { remark } from "remark";
import html from "remark-html";
import gfm from "remark-gfm";
import Link from "next/link";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  const reports = getAllReports();
  return reports.map((report) => ({
    id: report.id,
  }));
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const report = getReportById(id);

  if (!report) {
    return {
      title: "报告未找到",
    };
  }

  return {
    title: `${report.meta.title} - FinMacroSentinel`,
  };
}

export default async function ReportPage({ params }: PageProps) {
  const { id } = await params;
  const report = getReportById(id);

  if (!report) {
    notFound();
  }

  // 将 Markdown 转换为 HTML (使用 gfm 插件支持表格)
  const processedContent = await remark()
    .use(gfm)
    .use(html, { sanitize: false })
    .process(report.content);
  const contentHtml = processedContent.toString();

  return (
    <div className="page-enter max-w-4xl">
      {/* 报告内容 */}
      <article
        className="prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />

      {/* 底部返回链接 */}
      <div className="mt-10 pt-6 border-t border-[var(--border)]">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-[var(--secondary)] hover:text-[var(--accent)] no-underline transition-colors"
        >
          ← 返回报告列表
        </Link>
      </div>
    </div>
  );
}
