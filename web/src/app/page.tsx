import Link from "next/link";
import { getAllReports } from "@/lib/reports";

export default function Home() {
  const reports = getAllReports();

  return (
    <div className="page-enter">
      <div className="mb-12">
        <h1 className="text-3xl sm:text-4xl font-serif font-semibold text-[var(--primary)] mb-3 tracking-tight">
          财经时报
        </h1>
        <p className="text-[var(--secondary)] text-base sm:text-lg">
          机构级投研简报 · 宏观金融与大类资产分析
        </p>
      </div>

      {reports.length === 0 ? (
        <div className="empty-state">
          <div className="text-4xl mb-4 opacity-40">📭</div>
          <p className="text-[var(--secondary)] text-lg mb-2">暂无报告</p>
          <p className="text-sm text-[var(--secondary)] opacity-70">
            报告将在生成后显示在这里
          </p>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-5">
          {reports.map((report, index) => (
            <Link
              key={report.id}
              href={`/reports/${report.id}`}
              className="block no-underline hover:no-underline"
            >
              <article
                className="card cursor-pointer list-item"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="text-base sm:text-lg font-serif font-medium text-[var(--primary)] line-clamp-2 leading-relaxed">
                      {report.title}
                    </h2>
                    <span className="text-xl text-[var(--secondary)] opacity-40 shrink-0 transition-all duration-300 group-hover:translate-x-1">
                      →
                    </span>
                  </div>
                  {report.summary && (
                    <p className="text-sm text-[var(--secondary)] line-clamp-2 leading-relaxed opacity-80">
                      {report.summary}
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t border-[var(--border)] mt-1">
                    <p className="text-xs text-[var(--secondary)] opacity-60">
                      {report.date} · {report.time}
                    </p>
                    <span className="text-xs text-[var(--accent)] opacity-0 hover:opacity-100 transition-opacity">
                      阅读 →
                    </span>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
