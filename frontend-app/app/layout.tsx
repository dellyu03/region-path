import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RegionPath — 지역 청년 취업 AI 매칭 플랫폼",
  description:
    "지역 청년의 취업 정보 격차를 해소하는 AI 기반 채용 매칭 플랫폼. 지역 공고 트렌드 파악부터 AI 포트폴리오 생성, 공고 매칭까지.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#070d1f] text-gray-100" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
