import type { Metadata } from "next";
import { Newsreader, Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

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
      <body
        className={`${newsreader.variable} ${inter.variable} antialiased`}
      >
        <div className="min-h-screen flex flex-col">
          {/* 顶部导航 */}
          <header className="border-b border-[var(--border)] bg-[var(--entry)]">
            <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
              <Link href="/" className="text-xl font-semibold text-[var(--primary)] hover:no-underline">
                📈 FinMacroSentinel
              </Link>
              <nav className="flex gap-6 text-sm">
                <Link href="/" className="text-[var(--secondary)] hover:text-[var(--primary)]">
                  报告列表
                </Link>
              </nav>
            </div>
          </header>

          {/* 主内容区域 */}
          <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-8">
            {children}
          </main>

          {/* 页脚 */}
          <footer className="border-t border-[var(--border)] bg-[var(--entry)]">
            <div className="max-w-4xl mx-auto px-6 py-6 text-center text-sm text-[var(--secondary)]">
              FinMacroSentinel © 2026 | 机构级投研简报系统
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
