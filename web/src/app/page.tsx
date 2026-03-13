import Link from "next/link";
import { getAllReports } from "@/lib/reports";

export const dynamic = 'force-dynamic';

export default function Home() {
  const reports = getAllReports();

  return (
    <div className="page-enter">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-[var(--primary)] mb-2 tracking-tight">
          财经时报
        </h1>
        <p className="text-sm text-[var(--secondary)]">
          机构级投研简报 · 宏观金融与大类资产分析
        </p>
      </div>

      {reports.length === 0 ? (
        <div className="empty-state">
          <div className="text-4xl mb-4 opacity-40">📭</div>
          <p className="text-[var(--secondary)] text-lg mb-2">暂无报告</p>
          <p className="text-sm text-[var(--secondary)] opacity-60">
            报告将在生成后显示在这里
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {reports.map((report, index) => (
            <Link
              key={report.id}
              href={`/reports/${report.id}`}
              className="block no-underline hover:no-underline"
            >
              <article
                className="card cursor-pointer list-item py-4 min-h-[140px]"
                style={{ animationDelay: `${index * 0.03}s` }}
              >
                <div className="flex items-start gap-3">
                  <h2 className="flex-1 text-sm sm:text-base font-serif font-medium text-[var(--primary)] line-clamp-2 leading-snug">
                    {report.title}
                  </h2>
                  <span className="text-lg text-[var(--secondary)] opacity-30 shrink-0">
                    →
                  </span>
                </div>
                {/* 标签、摘要、日期放在标题下方 */}
                <div className="flex flex-col gap-1 mt-1">
                  {report.tags && report.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {report.tags.slice(0, 6).map((tag, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium text-[var(--secondary)] bg-[var(--background-secondary)] border border-[var(--border)] rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {report.summary && (
                    <p className="text-xs sm:text-sm text-[var(--secondary)] line-clamp-2 leading-snug opacity-70">
                      {report.summary}
                    </p>
                  )}
                  <p className="text-xs text-[var(--secondary)] opacity-40">
                    {report.date} · {report.time}
                  </p>
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
