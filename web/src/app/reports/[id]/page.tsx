import { getReportById, getAllReports } from "@/lib/reports";
import { remark } from "remark";
import html from "remark-html";
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

  // 将 Markdown 转换为 HTML
  const processedContent = await remark()
    .use(html, { sanitize: false })
    .process(report.content);
  const contentHtml = processedContent.toString();

  return (
    <div className="max-w-3xl">
      {/* 返回链接 */}
      <Link
        href="/"
        className="inline-flex items-center text-sm text-[var(--secondary)] hover:text-[var(--primary)] mb-8 no-underline transition-colors"
      >
        ← 返回报告列表
      </Link>

      {/* 简化元信息 */}
      <div className="mb-8 text-sm text-[var(--secondary)]">
        {report.meta.date} · {report.meta.time}
      </div>

      {/* 报告内容 */}
      <article
        className="prose prose-lg max-w-none prose-headings:font-serif prose-headings:text-[var(--primary)] prose-p:text-[var(--content)] prose-a:text-[var(--accent)] prose-strong:text-[var(--primary)]"
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />
    </div>
  );
}
