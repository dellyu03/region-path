import Link from "next/link";
import MismatchSection from "./MismatchSection";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen font-[family-name:var(--font-geist-sans)]">
      <header className="sticky top-0 z-50 border-b border-white/8 bg-[#070d1f]/90 backdrop-blur">
        <div className="mx-auto max-w-6xl flex h-14 items-center justify-between px-6">
          <span className="text-lg font-bold tracking-tight text-blue-400">
            📍 RegionPath
          </span>
          <nav className="hidden sm:flex gap-6 text-sm text-gray-400">
            <Link href="/trend" className="hover:text-blue-400 transition-colors">시각화</Link>
            <Link href="/portfolio" className="hover:text-blue-400 transition-colors">포트폴리오</Link>
            <Link href="/match" className="hover:text-blue-400 transition-colors">매칭</Link>
          </nav>
          <Link
            href="/trend"
            className="rounded-full bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
          >
            시작하기
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <MismatchSection />
      </main>

      <footer className="border-t border-white/8 bg-[#070d1f] py-8">
        <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-600">
          <span className="font-semibold text-gray-400">📍 RegionPath</span>
          <span>지역 청년의 취업 정보 격차를 해소합니다</span>
          <span>MIT License · 2025</span>
        </div>
      </footer>
    </div>
  );
}
