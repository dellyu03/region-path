"use client";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { useState, useCallback } from "react";
import { TabType, ProvinceData, getTabValue, getMismatch } from "./mockData";

const GEO_URL =
  "https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2012/json/provinces-geo-simple.json";

// GeoJSON 속성에서 한글 이름 추출
// 실제 데이터: { code, name(한글), name_eng, base_year }
function extractFullName(props: Record<string, unknown>): string {
  return (props.name as string) ?? "";
}

// 전체 시도명 → 단축명 매핑
const FULL_TO_SHORT: Record<string, string> = {
  서울특별시: "서울",
  부산광역시: "부산",
  대구광역시: "대구",
  인천광역시: "인천",
  광주광역시: "광주",
  대전광역시: "대전",
  울산광역시: "울산",
  세종특별자치시: "세종",
  경기도: "경기",
  강원특별자치도: "강원",
  강원도: "강원",
  충청북도: "충북",
  충청남도: "충남",
  전라북도: "전북",
  전북특별자치도: "전북",
  전라남도: "전남",
  경상북도: "경북",
  경상남도: "경남",
  제주특별자치도: "제주",
};

function hexToRgb(hex: string) {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

function lerpColor(t: number, from: string, to: string): string {
  const a = hexToRgb(from);
  const b = hexToRgb(to);
  return `rgb(${Math.round(a.r + t * (b.r - a.r))},${Math.round(a.g + t * (b.g - a.g))},${Math.round(a.b + t * (b.b - a.b))})`;
}

function getHeatColor(value: number, min: number, max: number, tab: TabType): string {
  if (max === min) return "#DBEAFE";
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)));
  if (tab === "mismatch") {
    // 낮은 미스매치(파랑) → 높은 미스매치(빨강)
    return t < 0.5
      ? lerpColor(t * 2, "#DBEAFE", "#FEF9C3")
      : lerpColor((t - 0.5) * 2, "#FEF9C3", "#EF4444");
  }
  // 낮음(연파랑) → 높음(진파랑)
  return lerpColor(t, "#DBEAFE", "#1D4ED8");
}

function formatValue(value: number, tab: TabType): string {
  if (tab === "mismatch") return `${value}%`;
  return value.toLocaleString("ko-KR") + "건";
}

interface Tooltip {
  name: string;
  fullName: string;
  jobs: number;
  workers: number;
  seekers: number;
  mismatch: number;
  x: number;
  y: number;
}

interface KoreaMapProps {
  data: ProvinceData[];
  tab: TabType;
}

export default function KoreaMap({ data, tab }: KoreaMapProps) {
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);

  const dataMap = Object.fromEntries(data.map((d) => [d.shortName, d]));
  const values = data.map((d) => getTabValue(d, tab));
  const min = Math.min(...values);
  const max = Math.max(...values);

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<SVGPathElement>, shortName: string) => {
      const svg = (e.target as SVGElement).closest("svg");
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const d = dataMap[shortName];
      if (!d) return;
      setTooltip({
        name: shortName,
        fullName: d.fullName,
        jobs: d.jobs,
        workers: d.workers,
        seekers: d.seekers,
        mismatch: getMismatch(d.jobs, d.seekers),
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    },
    [dataMap]
  );

  return (
    <div className="relative w-full select-none">
      <ComposableMap
        width={600}
        height={680}
        projection="geoMercator"
        projectionConfig={{ center: [127.9, 36.2], scale: 4800 }}
        style={{ width: "100%", height: "auto" }}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const fullName = extractFullName(
                geo.properties as Record<string, unknown>
              );
              const shortName = FULL_TO_SHORT[fullName] ?? fullName;
              const d = dataMap[shortName];
              const value = d ? getTabValue(d, tab) : 0;
              const fill = d
                ? getHeatColor(value, min, max, tab)
                : "#E2E8F0";

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={fill}
                  stroke="#ffffff"
                  strokeWidth={1.5}
                  style={{
                    default: { outline: "none", transition: "fill 0.3s" },
                    hover: { outline: "none", opacity: 0.75, cursor: "pointer" },
                    pressed: { outline: "none" },
                  }}
                  onMouseEnter={(e) => handleMouseEnter(e, shortName)}
                  onMouseLeave={() => setTooltip(null)}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none absolute z-20 min-w-44 rounded-xl bg-gray-900/95 px-4 py-3 text-white shadow-xl backdrop-blur"
          style={{
            left: tooltip.x + 12,
            top: Math.max(0, tooltip.y - 120),
          }}
        >
          <p className="mb-2 text-sm font-bold">{tooltip.fullName}</p>
          <div className="space-y-1 text-xs text-gray-300">
            <div className="flex justify-between gap-6">
              <span>채용공고</span>
              <span className="font-semibold text-white">
                {tooltip.jobs.toLocaleString("ko-KR")}건
              </span>
            </div>
            <div className="flex justify-between gap-6">
              <span>직무종사자</span>
              <span className="font-semibold text-white">
                {tooltip.workers.toLocaleString("ko-KR")}명
              </span>
            </div>
            <div className="flex justify-between gap-6">
              <span>희망 청년</span>
              <span className="font-semibold text-white">
                {tooltip.seekers.toLocaleString("ko-KR")}명
              </span>
            </div>
            <div className="mt-2 flex justify-between gap-6 border-t border-gray-700 pt-2">
              <span>미스매치 지수</span>
              <span
                className={`font-bold ${
                  tooltip.mismatch >= 60
                    ? "text-red-400"
                    : tooltip.mismatch >= 30
                    ? "text-yellow-400"
                    : "text-green-400"
                }`}
              >
                {tooltip.mismatch}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Color legend */}
      <div className="mt-3 flex items-center gap-3 px-1">
        <span className="text-xs text-gray-400">낮음</span>
        <div
          className="h-2 flex-1 rounded-full"
          style={{
            background:
              tab === "mismatch"
                ? "linear-gradient(to right, #DBEAFE, #FEF9C3, #EF4444)"
                : "linear-gradient(to right, #DBEAFE, #1D4ED8)",
          }}
        />
        <span className="text-xs text-gray-400">높음</span>
        {tab === "mismatch" && (
          <span className="text-xs text-red-400 font-medium">공급 부족</span>
        )}
      </div>
    </div>
  );
}