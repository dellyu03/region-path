"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  jobCategories,
  getProvinceData,
  getMismatch,
  getTabValue,
  type TabType,
  type ProvinceData,
} from "./mockData";
import { fetchTrendCounts } from "@/lib/api";

const KoreaMap3D = dynamic(() => import("./KoreaMap3D"), {
  ssr: false,
  loading: () => (
    <div className="flex h-96 items-center justify-center text-gray-600 text-sm">
      지도 로딩 중...
    </div>
  ),
});

const TABS: { id: TabType; label: string; desc: string }[] = [
  {
    id: "jobs",
    label: "채용공고 현황",
    desc: "지역별 해당 직종 채용공고 수 (고용24 API)",
  },
  {
    id: "workers",
    label: "직무 종사자",
    desc: "지역별 해당 직종 현직 종사자 수",
  },
  {
    id: "mismatch",
    label: "미스매치 현황",
    desc: "미스매치 지수 = (희망자 - 공고) / 희망자 × 100 · 수치가 높을수록 공급 부족",
  },
];

export default function TrendPage() {
  const [activeTab, setActiveTab] = useState<TabType>("jobs");
  const [jobId, setJobId] = useState("it");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedJob = jobCategories.find((j) => j.id === jobId)!;
  const filteredJobs = jobCategories.filter((j) => j.label.includes(search));

  // API 데이터 상태 (없으면 mock fallback)
  const [apiData, setApiData] = useState<ProvinceData[] | null>(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState(false);

  const mockData = useMemo(() => getProvinceData(jobId), [jobId]);

  const loadApiData = useCallback(async (group: string) => {
    setApiLoading(true);
    setApiError(false);
    try {
      const res = await fetchTrendCounts(group);
      const mock = getProvinceData(group);
      // API 채용공고 수를 mock의 workers/seekers와 병합
      const merged: ProvinceData[] = mock.map((m) => {
        const apiRegion = res.regions.find((r) => r.region === m.shortName);
        return apiRegion ? { ...m, jobs: apiRegion.count } : m;
      });
      setApiData(merged);
    } catch {
      setApiError(true);
      setApiData(null);
    } finally {
      setApiLoading(false);
    }
  }, []);

  useEffect(() => {
    loadApiData(jobId);
  }, [jobId, loadApiData]);

  const data = apiData ?? mockData;

  const ranked = useMemo(
    () =>
      [...data]
        .sort((a, b) => getTabValue(b, activeTab) - getTabValue(a, activeTab))
        .slice(0, 5),
    [data, activeTab]
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const totalJobs = data.reduce((s, d) => s + d.jobs, 0);
  const totalWorkers = data.reduce((s, d) => s + d.workers, 0);
  const totalSeekers = data.reduce((s, d) => s + d.seekers, 0);
  const avgMismatch = Math.round(
    data.reduce((s, d) => s + getMismatch(d.jobs, d.seekers), 0) / data.length
  );

  return (
    <div className="min-h-screen bg-[#070d1f] font-[family-name:var(--font-geist-sans)]">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/8 bg-[#070d1f]/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="text-lg font-bold text-blue-400">
            📍 RegionPath
          </Link>
          <nav className="flex gap-6 text-sm">
            <span className="font-semibold text-blue-400">시각화</span>
            <Link href="/portfolio" className="text-gray-500 hover:text-gray-200 transition-colors">
              포트폴리오
            </Link>
            <Link href="/match" className="text-gray-500 hover:text-gray-200 transition-colors">
              매칭
            </Link>
          </nav>
        </div>
      </header>

      {/* Page header + Job selector */}
      <div className="mx-auto max-w-7xl px-6 pt-8 pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-100">지역별 채용 트렌드</h1>
            <p className="mt-1 text-sm text-gray-500">
              직종·지역별 채용공고 현황과 미스매치를 인터랙티브 지도로 시각화합니다
            </p>
          </div>

          {/* Job selector dropdown */}
          <div ref={dropdownRef} className="relative">
            <p className="mb-1 text-xs font-semibold text-gray-600 uppercase tracking-widest">
              직종 선택
            </p>
            <button
              onClick={() => setOpen((v) => !v)}
              className="flex min-w-52 items-center justify-between gap-3 rounded-xl border border-white/10 bg-gray-900 px-4 py-2.5 text-sm font-semibold text-gray-200 shadow-sm transition-colors hover:border-blue-500/50 focus:outline-none"
            >
              <span>{selectedJob.label}</span>
              <svg
                className={`h-4 w-4 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {open && (
              <div className="absolute right-0 top-full z-50 mt-1 w-56 overflow-hidden rounded-xl border border-white/10 bg-gray-900 shadow-2xl">
                <div className="p-2 border-b border-white/8">
                  <input
                    className="w-full rounded-lg border border-white/10 bg-gray-800 px-3 py-1.5 text-sm text-gray-200 placeholder-gray-600 focus:border-blue-500/50 focus:outline-none"
                    placeholder="직종 검색..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                  />
                </div>
                <div className="max-h-60 overflow-y-auto py-1">
                  {filteredJobs.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-gray-600">검색 결과 없음</p>
                  ) : (
                    filteredJobs.map((job) => (
                      <button
                        key={job.id}
                        onClick={() => {
                          setJobId(job.id);
                          setOpen(false);
                          setSearch("");
                        }}
                        className={`w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-white/5 ${
                          job.id === jobId
                            ? "bg-blue-500/10 font-semibold text-blue-400"
                            : "text-gray-400"
                        }`}
                      >
                        {job.label}
                        {job.id === jobId && (
                          <span className="ml-2 text-blue-500">✓</span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mx-auto max-w-7xl px-6 pb-4">
        <div className="flex w-fit gap-1 rounded-xl bg-gray-900 p-1 border border-white/8">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-lg px-5 py-2 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-white/10 text-gray-100 shadow-sm"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-gray-600">
          {TABS.find((t) => t.id === activeTab)?.desc}
        </p>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-7xl px-6 pb-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Map card */}
        <div className="lg:col-span-2 rounded-2xl border border-white/8 bg-gray-900/50 p-5">
          <div className="mb-3 flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-gray-300">
              {selectedJob.label} ·{" "}
              {activeTab === "jobs"
                ? "채용공고 현황"
                : activeTab === "workers"
                ? "직무 종사자"
                : "미스매치 지수"}
            </span>
            {apiLoading && (
              <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-xs text-blue-400 border border-blue-500/20 animate-pulse">
                ⟳ API 조회 중...
              </span>
            )}
            {!apiLoading && apiError && (
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-400 border border-amber-500/20">
                ⚠ Mock 데이터 (API 연결 필요)
              </span>
            )}
            {!apiLoading && apiData && (
              <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-xs text-green-400 border border-green-500/20">
                ✓ 고용24 실시간
              </span>
            )}
          </div>
          <KoreaMap3D data={data} tab={activeTab} height={520} />
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          {/* Rankings */}
          <div className="rounded-2xl border border-white/8 bg-gray-900/50 p-5">
            <h3 className="mb-4 text-sm font-bold text-gray-400">
              {activeTab === "jobs" && "채용공고 상위 지역 TOP 5"}
              {activeTab === "workers" && "종사자 수 상위 지역 TOP 5"}
              {activeTab === "mismatch" && "미스매치 심각 지역 TOP 5"}
            </h3>
            <div className="space-y-3">
              {ranked.map((province, i) => {
                const value = getTabValue(province, activeTab);
                const maxVal = getTabValue(ranked[0], activeTab);
                const pct = maxVal > 0 ? Math.round((value / maxVal) * 100) : 0;
                return (
                  <div key={province.shortName}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm text-gray-300">
                        <span className="mr-2 text-xs font-bold text-gray-700">
                          #{i + 1}
                        </span>
                        {province.shortName}
                      </span>
                      <span className="text-xs font-semibold text-gray-400">
                        {activeTab === "mismatch"
                          ? `${value}%`
                          : value.toLocaleString("ko-KR")}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          activeTab === "mismatch" ? "bg-red-500" : "bg-blue-500"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary stats */}
          <div className="rounded-2xl border border-white/8 bg-gray-900/50 p-5">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-600">
              전국 합계 · {selectedJob.label}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-3">
                <p className="text-lg font-bold text-blue-400">
                  {totalJobs.toLocaleString("ko-KR")}
                </p>
                <p className="text-xs text-blue-600">총 채용공고</p>
              </div>
              <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-3">
                <p className="text-lg font-bold text-green-400">
                  {totalSeekers.toLocaleString("ko-KR")}
                </p>
                <p className="text-xs text-green-600">희망 청년</p>
              </div>
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3">
                <p className="text-lg font-bold text-amber-400">
                  {totalWorkers.toLocaleString("ko-KR")}
                </p>
                <p className="text-xs text-amber-600">총 종사자</p>
              </div>
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3">
                <p className="text-lg font-bold text-red-400">{avgMismatch}%</p>
                <p className="text-xs text-red-600">평균 미스매치</p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-5">
            <p className="text-sm font-bold text-blue-300 mb-1">
              이 직종으로 포트폴리오를 만들어볼까요?
            </p>
            <p className="text-xs text-blue-500 mb-4">
              AI가 지역 공고 트렌드를 반영한 맞춤 포트폴리오를 생성합니다.
            </p>
            <Link
              href="/portfolio"
              className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition-colors"
            >
              AI 포트폴리오 생성 →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
