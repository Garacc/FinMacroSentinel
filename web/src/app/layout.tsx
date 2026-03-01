import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FinMacroSentinel 财经时报",
  description: "机构级投研简报 - 宏观金融与大类资产分析",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        <div className="min-h-screen flex flex-col">
          {/* 顶部导航 */}
          <header className="sticky top-0 z-50">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
              <Link
                href="/"
                className="text-lg sm:text-xl font-serif font-semibold text-[var(--primary)] hover:no-underline transition-colors"
              >
                <span className="hidden sm:inline">📈 FinMacroSentinel</span>
                <span className="sm:hidden">📈 FinMacro</span>
              </Link>
              <nav className="flex gap-4 sm:gap-6 text-sm">
                <Link
                  href="/"
                  className="text-[var(--secondary)] hover:text-[var(--accent)] transition-colors relative group"
                >
                  报告列表
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[var(--accent)] transition-all group-hover:w-full"></span>
                </Link>
              </nav>
            </div>
          </header>

          {/* 主内容区域 */}
          <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6">
            {children}
          </main>

          {/* 页脚 */}
          <footer>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 text-center text-sm text-[var(--secondary)] opacity-60">
              FinMacroSentinel © 2026 · 机构级投研简报系统
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
