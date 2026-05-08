"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { getProvinceData, getMismatch } from "./trend/mockData";

const KoreaMap3D = dynamic(() => import("./trend/KoreaMap3D"), {
  ssr: false,
  loading: () => (
    <div className="flex h-80 items-center justify-center text-gray-500 text-sm">
      지도 로딩 중...
    </div>
  ),
});

const data = getProvinceData("it");

const sorted = [...data].sort(
  (a, b) => getMismatch(b.jobs, b.seekers) - getMismatch(a.jobs, a.seekers)
);
const worst = sorted[0];
const best = sorted[sorted.length - 1];
const avgMismatch = Math.round(
  data.reduce((s, d) => s + getMismatch(d.jobs, d.seekers), 0) / data.length
);
const top5 = sorted.slice(0, 5);

export default function MismatchSection() {
  return (
    <section className="bg-gray-950 py-20 text-white">
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <div className="mb-12 text-center">
          <span className="inline-block rounded-full bg-red-500/20 px-3 py-1 text-xs font-semibold text-red-400 mb-4 tracking-widest uppercase">
            지금 이 순간의 현실
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-4">
            청년은 지역에 있고,<br />
            <span className="text-red-400">일자리는 수도권에만 있습니다</span>
          </h2>
          <p className="text-gray-400 text-base max-w-xl mx-auto">
            미스매치 지수 = (취업 희망 청년 − 채용공고) ÷ 희망 청년 × 100<br />
            수치가 높을수록 공고 대비 희망자가 훨씬 많은 공급 부족 지역입니다.
          </p>
        </div>

        {/* 핵심 수치 3개 */}
        <div className="grid grid-cols-3 gap-4 mb-12">
          <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-6 text-center">
            <p className="text-4xl sm:text-5xl font-black text-red-400 mb-1">
              {getMismatch(worst.jobs, worst.seekers)}%
            </p>
            <p className="text-sm text-gray-400">
              최고 미스매치
            </p>
            <p className="text-xs font-semibold text-red-300 mt-1">{worst.shortName}</p>
          </div>
          <div className="rounded-2xl bg-white/5 border border-white/10 p-6 text-center">
            <p className="text-4xl sm:text-5xl font-black text-white mb-1">
              {avgMismatch}%
            </p>
            <p className="text-sm text-gray-400">전국 평균</p>
            <p className="text-xs font-semibold text-gray-400 mt-1">IT/소프트웨어 기준</p>
          </div>
          <div className="rounded-2xl bg-blue-500/10 border border-blue-500/20 p-6 text-center">
            <p className="text-4xl sm:text-5xl font-black text-blue-400 mb-1">
              {getMismatch(best.jobs, best.seekers)}%
            </p>
            <p className="text-sm text-gray-400">최저 미스매치</p>
            <p className="text-xs font-semibold text-blue-300 mt-1">{best.shortName}</p>
          </div>
        </div>

        {/* 지도 + 랭킹 */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          {/* 지도 */}
          <div className="lg:col-span-3 rounded-2xl bg-white/5 border border-white/10 p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
              지역별 미스매치 히트맵 · IT/소프트웨어
            </p>
            <KoreaMap3D data={data} tab="mismatch" height={420} />
          </div>

          {/* 심각 지역 랭킹 */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
              <p className="text-xs font-semibold text-red-400 uppercase tracking-widest mb-5">
                미스매치 심각 지역 TOP 5
              </p>
              <div className="space-y-4">
                {top5.map((province, i) => {
                  const val = getMismatch(province.jobs, province.seekers);
                  const pct = (val / getMismatch(worst.jobs, worst.seekers)) * 100;
                  return (
                    <div key={province.shortName}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-sm text-gray-300 flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-600">#{i + 1}</span>
                          {province.shortName}
                          <span className="text-xs text-gray-500">
                            ({province.seekers.toLocaleString()}명 희망 / {province.jobs.toLocaleString()}건 공고)
                          </span>
                        </span>
                        <span className="text-sm font-bold text-red-400">{val}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 서울 vs 지방 비교 */}
            <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
                서울 vs {worst.shortName} 비교
              </p>
              <div className="space-y-3 text-sm">
                {[
                  {
                    label: "채용공고",
                    seoul: best.jobs,
                    other: worst.jobs,
                    unit: "건",
                  },
                  {
                    label: "희망 청년",
                    seoul: best.seekers,
                    other: worst.seekers,
                    unit: "명",
                  },
                  {
                    label: "미스매치",
                    seoul: getMismatch(best.jobs, best.seekers),
                    other: getMismatch(worst.jobs, worst.seekers),
                    unit: "%",
                  },
                ].map((row) => (
                  <div key={row.label} className="flex items-center gap-3">
                    <span className="w-16 shrink-0 text-xs text-gray-500">{row.label}</span>
                    <div className="flex flex-1 items-center gap-2 text-xs">
                      <span className="text-blue-300 font-semibold w-20 text-right">
                        {row.label === "미스매치"
                          ? `${row.seoul}${row.unit}`
                          : `${row.seoul.toLocaleString()}${row.unit}`}
                      </span>
                      <span className="text-gray-600 font-bold">서울</span>
                      <span className="text-gray-600 mx-1">vs</span>
                      <span className="text-gray-600 font-bold">{worst.shortName}</span>
                      <span className="text-red-300 font-semibold w-20">
                        {row.label === "미스매치"
                          ? `${row.other}${row.unit}`
                          : `${row.other.toLocaleString()}${row.unit}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Link
              href="/trend"
              className="flex items-center justify-center gap-2 rounded-xl bg-red-500 py-3 text-sm font-bold text-white hover:bg-red-600 transition-colors"
            >
              전체 지역 미스매치 지도 보기 →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
