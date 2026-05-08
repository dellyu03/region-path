"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import {
  fetchSeoulEmployment,
  fetchNationalBusiness,
  type DistrictEmployment,
  type BusinessRegion,
} from "@/lib/api";
import type { MetricKey } from "./SeoulMap";

const SeoulMap = dynamic(() => import("./SeoulMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-96 items-center justify-center text-gray-500 text-sm">
      지도 로딩 중...
    </div>
  ),
});

const PROVINCES_URL =
  "https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2012/json/provinces-geo-simple.json";

const FULL_TO_SHORT: Record<string, string> = {
  서울특별시: "서울", 부산광역시: "부산", 대구광역시: "대구",
  인천광역시: "인천", 광주광역시: "광주", 대전광역시: "대전",
  울산광역시: "울산", 세종특별자치시: "세종", 경기도: "경기",
  강원특별자치도: "강원", 강원도: "강원", 충청북도: "충북",
  충청남도: "충남", 전라북도: "전북", 전북특별자치도: "전북",
  전라남도: "전남", 경상북도: "경북", 경상남도: "경남",
  제주특별자치도: "제주",
};

function lerpColor(t: number, from: string, to: string): string {
  const h = (hex: string) => ({
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  });
  const a = h(from);
  const b = h(to);
  return `rgb(${Math.round(a.r + t * (b.r - a.r))},${Math.round(a.g + t * (b.g - a.g))},${Math.round(a.b + t * (b.b - a.b))})`;
}

const YEAR_MONTHS = [
  { value: "202601", label: "2026년 1월" },
  { value: "202512", label: "2025년 12월" },
  { value: "202511", label: "2025년 11월" },
  { value: "202510", label: "2025년 10월" },
];
const AGE_OPTIONS = [
  { value: "01", label: "15~19세" }, { value: "02", label: "20~24세" },
  { value: "03", label: "25~29세" }, { value: "04", label: "30~34세" },
  { value: "05", label: "35~39세" }, { value: "06", label: "40~44세" },
  { value: "07", label: "45~49세" }, { value: "08", label: "50~54세" },
  { value: "09", label: "55~59세" }, { value: "10", label: "60세 이상" },
];
const METRICS: { id: MetricKey; label: string; color: string }[] = [
  { id: "employed",    label: "취업건수",      color: "text-blue-400" },
  { id: "new_seekers", label: "신규구직건수",  color: "text-green-400" },
  { id: "new_jobs",    label: "신규구인인원",  color: "text-amber-400" },
];

type PageTab = "seoul" | "national";

export default function EmploymentPage() {
  const [pageTab, setPageTab]   = useState<PageTab>("seoul");
  const [metric, setMetric]     = useState<MetricKey>("employed");
  const [yearMonth, setYearMonth] = useState("202601");
  const [sex, setSex]           = useState("M");
  const [age, setAge]           = useState("02");

  const [seoulData, setSeoulData]     = useState<DistrictEmployment[]>([]);
  const [seoulLoading, setSeoulLoading] = useState(false);
  const [seoulError, setSeoulError]   = useState(false);
  const [seoulCached, setSeoulCached] = useState(false);

  const [bizData, setBizData]       = useState<BusinessRegion[]>([]);
  const [bizTooltip, setBizTooltip] = useState<{ x: number; y: number; region: BusinessRegion } | null>(null);

  const loadSeoul = useCallback(async () => {
    setSeoulLoading(true);
    setSeoulError(false);
    try {
      const res = await fetchSeoulEmployment(yearMonth, sex, age);
      setSeoulData(res.districts);
      setSeoulCached(res.cached);
    } catch {
      setSeoulError(true);
    } finally {
      setSeoulLoading(false);
    }
  }, [yearMonth, sex, age]);

  useEffect(() => {
    if (pageTab === "seoul") loadSeoul();
  }, [pageTab, loadSeoul]);

  useEffect(() => {
    if (pageTab === "national" && bizData.length === 0) {
      fetchNationalBusiness().then((r) => setBizData(r.regions)).catch(() => {});
    }
  }, [pageTab, bizData.length]);

  const sorted = [...seoulData].sort((a, b) => b[metric] - a[metric]);
  const top5 = sorted.slice(0, 5);
  const maxVal = top5[0]?.[metric] ?? 1;

  const bizSorted = [...bizData].sort((a, b) => b.count - a.count);
  const bizTop5 = bizSorted.slice(0, 5);
  const bizMax = bizTop5[0]?.count ?? 1;
  const bizDataMap = Object.fromEntries(bizData.map((d) => [d.shortName, d]));
  const bizCounts = bizData.map((d) => d.count);
  const bizMin = Math.min(...(bizCounts.length ? bizCounts : [0]));
  const bizMaxAll = Math.max(...(bizCounts.length ? bizCounts : [1]));

  return (
    <div className="min-h-screen bg-[#070d1f] font-[family-name:var(--font-geist-sans)]">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/8 bg-[#070d1f]/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="text-lg font-bold text-blue-400">
            📍 RegionPath
          </Link>
          <nav className="flex gap-6 text-sm">
            <Link href="/trend" className="text-gray-500 hover:text-gray-200 transition-colors">
              시각화
            </Link>
            <span className="font-semibold text-blue-400">고용·산업</span>
            <Link href="/portfolio" className="text-gray-500 hover:text-gray-200 transition-colors">
              포트폴리오
            </Link>
          </nav>
        </div>
      </header>

      {/* Page header */}
      <div className="mx-auto max-w-7xl px-6 pt-8 pb-4">
        <h1 className="text-2xl font-bold text-gray-100">지역별 고용·산업 현황</h1>
        <p className="mt-1 text-sm text-gray-500">
          ECIS 고용통계(서울 구별) · SGIS 사업체 통계(전국 시도별)
        </p>
      </div>

      {/* Page tabs */}
      <div className="mx-auto max-w-7xl px-6 pb-4">
        <div className="flex w-fit gap-1 rounded-xl bg-gray-900 p-1 border border-white/8">
          {(
            [
              { id: "seoul", label: "서울 고용통계" },
              { id: "national", label: "전국 사업체 통계" },
            ] as { id: PageTab; label: string }[]
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setPageTab(t.id)}
              className={`rounded-lg px-5 py-2 text-sm font-medium transition-all ${
                pageTab === t.id
                  ? "bg-white/10 text-gray-100 shadow-sm"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── 서울 고용통계 ── */}
      {pageTab === "seoul" && (
        <div className="mx-auto max-w-7xl px-6 pb-10">
          {/* Filters */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <select
              value={yearMonth}
              onChange={(e) => setYearMonth(e.target.value)}
              className="rounded-lg border border-white/10 bg-gray-900 px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50"
            >
              {YEAR_MONTHS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            <div className="flex rounded-lg border border-white/10 overflow-hidden">
              {["M", "F"].map((s) => (
                <button
                  key={s}
                  onClick={() => setSex(s)}
                  className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                    sex === s
                      ? "bg-blue-600 text-white"
                      : "bg-gray-900 text-gray-400 hover:text-gray-200"
                  }`}
                >
                  {s === "M" ? "남성" : "여성"}
                </button>
              ))}
            </div>

            <select
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="rounded-lg border border-white/10 bg-gray-900 px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50"
            >
              {AGE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            {seoulLoading && (
              <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-xs text-blue-400 border border-blue-500/20 animate-pulse">
                ⟳ ECIS 조회 중...
              </span>
            )}
            {!seoulLoading && seoulError && (
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-400 border border-amber-500/20">
                ⚠ API 연결 실패
              </span>
            )}
            {!seoulLoading && !seoulError && seoulData.length > 0 && (
              <span className={`rounded-full px-2 py-0.5 text-xs border ${seoulCached ? "bg-gray-500/15 text-gray-400 border-gray-500/20" : "bg-green-500/15 text-green-400 border-green-500/20"}`}>
                {seoulCached ? "캐시" : "✓ ECIS 실시간"}
              </span>
            )}
          </div>

          {/* Metric tabs */}
          <div className="mb-4 flex gap-1 rounded-xl bg-gray-900 p-1 border border-white/8 w-fit">
            {METRICS.map((m) => (
              <button
                key={m.id}
                onClick={() => setMetric(m.id)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  metric === m.id
                    ? "bg-white/10 text-gray-100"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Map */}
            <div className="lg:col-span-2 rounded-2xl border border-white/8 bg-gray-900/50 p-5">
              <p className="mb-3 text-sm font-bold text-gray-300">
                서울 구별 {METRICS.find((m) => m.id === metric)?.label}
                <span className="ml-2 text-xs font-normal text-gray-500">
                  ({YEAR_MONTHS.find((y) => y.value === yearMonth)?.label} ·{" "}
                  {sex === "M" ? "남성" : "여성"} ·{" "}
                  {AGE_OPTIONS.find((a) => a.value === age)?.label})
                </span>
              </p>
              {seoulData.length > 0 ? (
                <SeoulMap data={seoulData} metric={metric} />
              ) : (
                <div className="flex h-80 items-center justify-center text-gray-600 text-sm">
                  {seoulLoading ? "데이터 불러오는 중..." : "데이터 없음"}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl border border-white/8 bg-gray-900/50 p-5">
                <h3 className="mb-4 text-sm font-bold text-gray-400">
                  {METRICS.find((m) => m.id === metric)?.label} 상위 구 TOP 5
                </h3>
                <div className="space-y-3">
                  {top5.map((d, i) => {
                    const value = d[metric];
                    const pct = maxVal > 0 ? Math.round((value / maxVal) * 100) : 0;
                    const color = METRICS.find((m) => m.id === metric)?.color ?? "text-blue-400";
                    return (
                      <div key={d.district}>
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-sm text-gray-300">
                            <span className="mr-2 text-xs font-bold text-gray-600">#{i + 1}</span>
                            서울 {d.district}
                          </span>
                          <span className={`text-xs font-semibold ${color}`}>
                            {value.toLocaleString("ko-KR")}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/5">
                          <div
                            className="h-full rounded-full transition-all duration-500 bg-blue-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {seoulData.length === 0 && !seoulLoading && (
                    <p className="text-xs text-gray-600">데이터 없음</p>
                  )}
                </div>
              </div>

              {/* Summary */}
              <div className="rounded-2xl border border-white/8 bg-gray-900/50 p-5">
                <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-600">
                  서울 전체 합계
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {METRICS.map(({ id, label }) => {
                    const total = seoulData.reduce((s, d) => s + d[id], 0);
                    const bgMap: Record<MetricKey, string> = {
                      employed:    "bg-blue-500/10 border-blue-500/20",
                      new_seekers: "bg-green-500/10 border-green-500/20",
                      new_jobs:    "bg-amber-500/10 border-amber-500/20",
                    };
                    const textMap: Record<MetricKey, string> = {
                      employed:    "text-blue-400",
                      new_seekers: "text-green-400",
                      new_jobs:    "text-amber-400",
                    };
                    return (
                      <div key={id} className={`rounded-xl border p-3 ${bgMap[id]}`}>
                        <p className={`text-lg font-bold ${textMap[id]}`}>
                          {total.toLocaleString("ko-KR")}
                        </p>
                        <p className="text-xs text-gray-500">{label}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 전국 사업체 통계 ── */}
      {pageTab === "national" && (
        <div className="mx-auto max-w-7xl px-6 pb-10">
          <div className="mb-4 flex items-center gap-2">
            <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-xs text-green-400 border border-green-500/20">
              SGIS 2019년 기준
            </span>
            <span className="text-xs text-gray-600">전국 시도별 전체 사업체 수</span>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* National map */}
            <div className="lg:col-span-2 rounded-2xl border border-white/8 bg-gray-900/50 p-5">
              <p className="mb-3 text-sm font-bold text-gray-300">전국 시도별 사업체 수</p>
              <div className="relative w-full select-none">
                <ComposableMap
                  width={600}
                  height={680}
                  projection="geoMercator"
                  projectionConfig={{ center: [127.9, 36.2], scale: 4800 }}
                  style={{ width: "100%", height: "auto" }}
                >
                  <Geographies geography={PROVINCES_URL}>
                    {({ geographies }) =>
                      geographies.map((geo) => {
                        const fullName = String(geo.properties?.name ?? "");
                        const shortName = FULL_TO_SHORT[fullName] ?? fullName;
                        const d = bizDataMap[shortName];
                        const value = d?.count ?? 0;
                        const t =
                          bizMaxAll === bizMin || !d
                            ? 0
                            : (value - bizMin) / (bizMaxAll - bizMin);
                        const fill = d ? lerpColor(t, "#D1FAE5", "#065F46") : "#1e293b";
                        return (
                          <Geography
                            key={geo.rsmKey}
                            geography={geo}
                            fill={fill}
                            stroke="#0f172a"
                            strokeWidth={1.2}
                            style={{
                              default: { outline: "none", transition: "fill 0.3s" },
                              hover:   { outline: "none", opacity: 0.8, cursor: "pointer" },
                              pressed: { outline: "none" },
                            }}
                            onMouseEnter={(e) => {
                              if (!d) return;
                              const svg = (e.target as SVGElement).closest("svg");
                              if (!svg) return;
                              const rect = svg.getBoundingClientRect();
                              setBizTooltip({
                                x: e.clientX - rect.left,
                                y: e.clientY - rect.top,
                                region: d,
                              });
                            }}
                            onMouseLeave={() => setBizTooltip(null)}
                          />
                        );
                      })
                    }
                  </Geographies>
                </ComposableMap>

                {bizTooltip && (
                  <div
                    className="pointer-events-none absolute z-20 min-w-44 rounded-xl bg-gray-900/95 px-4 py-3 text-white shadow-xl backdrop-blur border border-white/10"
                    style={{
                      left: Math.min(bizTooltip.x + 12, 380),
                      top: Math.max(0, bizTooltip.y - 80),
                    }}
                  >
                    <p className="mb-1.5 text-sm font-bold">{bizTooltip.region.fullName}</p>
                    <div className="flex justify-between gap-6 text-xs">
                      <span className="text-gray-400">사업체 수</span>
                      <span className="font-semibold text-green-400">
                        {bizTooltip.region.count.toLocaleString("ko-KR")}개
                      </span>
                    </div>
                  </div>
                )}

                <div className="mt-2 flex items-center gap-3 px-1">
                  <span className="text-xs text-gray-500">낮음</span>
                  <div
                    className="h-2 flex-1 rounded-full"
                    style={{ background: "linear-gradient(to right, #D1FAE5, #065F46)" }}
                  />
                  <span className="text-xs text-gray-500">높음</span>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl border border-white/8 bg-gray-900/50 p-5">
                <h3 className="mb-4 text-sm font-bold text-gray-400">사업체 수 TOP 5 지역</h3>
                <div className="space-y-3">
                  {bizTop5.map((d, i) => {
                    const pct = bizMax > 0 ? Math.round((d.count / bizMax) * 100) : 0;
                    return (
                      <div key={d.shortName}>
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-sm text-gray-300">
                            <span className="mr-2 text-xs font-bold text-gray-600">#{i + 1}</span>
                            {d.shortName}
                          </span>
                          <span className="text-xs font-semibold text-green-400">
                            {d.count.toLocaleString("ko-KR")}개
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/5">
                          <div
                            className="h-full rounded-full transition-all duration-500 bg-green-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-white/8 bg-gray-900/50 p-5">
                <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-600">
                  전국 총계
                </h3>
                <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-4">
                  <p className="text-xl font-bold text-green-400">
                    {bizData.reduce((s, d) => s + d.count, 0).toLocaleString("ko-KR")}
                  </p>
                  <p className="text-xs text-green-700 mt-1">총 사업체 수 (전국)</p>
                </div>
                <p className="mt-3 text-xs text-gray-600">
                  출처: 통계청 사업체조사 (SGIS) · 2019년 기준
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
