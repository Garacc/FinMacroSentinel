import Link from "next/link";
import { getAllReports } from "@/lib/reports";

export default function Home() {
  const reports = getAllReports();

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-3xl font-serif font-semibold text-[var(--primary)] mb-3">
          财经时报
        </h1>
        <p className="text-[var(--secondary)] text-base">
          机构级投研简报 · 宏观金融与大类资产分析
        </p>
      </div>

      {reports.length === 0 ? (
        <div className="text-center py-16 card">
          <p className="text-[var(--secondary)]">暂无报告</p>
          <p className="text-sm text-[var(--secondary)] mt-2">
            报告将在生成后显示在这里
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <Link
              key={report.id}
              href={`/reports/${report.id}`}
              className="block no-underline hover:no-underline"
            >
              <article className="card cursor-pointer">
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="text-lg font-serif font-medium text-[var(--primary)] line-clamp-2">
                      {report.title}
                    </h2>
                    <span className="text-xl text-[var(--secondary)] opacity-60 shrink-0">→</span>
                  </div>
                  {report.summary && (
                    <p className="text-sm text-[var(--secondary)] line-clamp-2 leading-relaxed">
                      {report.summary}
                    </p>
                  )}
                  <p className="text-xs text-[var(--secondary)] opacity-70">
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
