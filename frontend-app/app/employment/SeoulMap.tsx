"use client";
import { useState, useCallback } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { DistrictEmployment } from "@/lib/api";

const GEO_URL =
  "https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2012/json/municipalities-geo-simple.json";

export type MetricKey = "employed" | "new_seekers" | "new_jobs";

const SEOUL_DISTRICT_SET = new Set([
  "종로구", "중구", "용산구", "성동구", "광진구", "동대문구",
  "중랑구", "성북구", "강북구", "도봉구", "노원구", "은평구",
  "서대문구", "마포구", "양천구", "강서구", "구로구", "금천구",
  "영등포구", "동작구", "관악구", "서초구", "강남구", "송파구", "강동구",
]);

// "서울특별시 종로구" 또는 "종로구" 모두 처리
function extractDistrictName(rawName: string): string {
  const parts = rawName.split(" ");
  return parts[parts.length - 1];
}

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

const METRIC_COLORS: Record<MetricKey, [string, string]> = {
  employed:     ["#DBEAFE", "#1D4ED8"],
  new_seekers:  ["#D1FAE5", "#065F46"],
  new_jobs:     ["#FEF3C7", "#B45309"],
};

interface Tooltip {
  x: number;
  y: number;
  district: string;
  data: DistrictEmployment;
}

interface SeoulMapProps {
  data: DistrictEmployment[];
  metric: MetricKey;
}

export default function SeoulMap({ data, metric }: SeoulMapProps) {
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);

  const dataMap = Object.fromEntries(data.map((d) => [d.district, d]));
  const values = data.map((d) => d[metric]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const [colorFrom, colorTo] = METRIC_COLORS[metric];

  const handleEnter = useCallback(
    (e: React.MouseEvent<SVGPathElement>, districtName: string) => {
      const svg = (e.target as SVGElement).closest("svg");
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const d = dataMap[districtName];
      if (!d) return;
      setTooltip({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        district: districtName,
        data: d,
      });
    },
    [dataMap]
  );

  return (
    <div className="relative w-full select-none">
      <ComposableMap
        width={600}
        height={560}
        projection="geoMercator"
        projectionConfig={{ center: [126.978, 37.566], scale: 55000 }}
        style={{ width: "100%", height: "auto" }}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies
              .filter((geo) => {
                const name = String(geo.properties?.name ?? "");
                return SEOUL_DISTRICT_SET.has(extractDistrictName(name));
              })
              .map((geo) => {
                const name = extractDistrictName(
                  String(geo.properties?.name ?? "")
                );
                const d = dataMap[name];
                const value = d ? d[metric] : 0;
                const t =
                  max === min || !d
                    ? 0
                    : (value - min) / (max - min);
                const fill = d ? lerpColor(t, colorFrom, colorTo) : "#334155";

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={fill}
                    stroke="#0f172a"
                    strokeWidth={1.2}
                    style={{
                      default: { outline: "none", transition: "fill 0.3s" },
                      hover: { outline: "none", opacity: 0.8, cursor: "pointer" },
                      pressed: { outline: "none" },
                    }}
                    onMouseEnter={(e) => handleEnter(e, name)}
                    onMouseLeave={() => setTooltip(null)}
                  />
                );
              })
          }
        </Geographies>
      </ComposableMap>

      {tooltip && (
        <div
          className="pointer-events-none absolute z-20 min-w-44 rounded-xl bg-gray-900/95 px-4 py-3 text-white shadow-xl backdrop-blur border border-white/10"
          style={{
            left: Math.min(tooltip.x + 12, 420),
            top: Math.max(0, tooltip.y - 130),
          }}
        >
          <p className="mb-2 text-sm font-bold text-gray-100">
            서울 {tooltip.district}
          </p>
          <div className="space-y-1.5 text-xs">
            {[
              { label: "취업건수",     value: tooltip.data.employed,    color: "text-blue-400" },
              { label: "신규구직건수", value: tooltip.data.new_seekers, color: "text-green-400" },
              { label: "신규구인인원", value: tooltip.data.new_jobs,    color: "text-amber-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex justify-between gap-6">
                <span className="text-gray-400">{label}</span>
                <span className={`font-semibold ${color}`}>
                  {value.toLocaleString("ko-KR")}건
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 범례 */}
      <div className="mt-2 flex items-center gap-3 px-1">
        <span className="text-xs text-gray-500">낮음</span>
        <div
          className="h-2 flex-1 rounded-full"
          style={{ background: `linear-gradient(to right, ${colorFrom}, ${colorTo})` }}
        />
        <span className="text-xs text-gray-500">높음</span>
      </div>
    </div>
  );
}
