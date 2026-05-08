"use client";
import { useState } from "react";
import DeckGL from "@deck.gl/react";
import { GeoJsonLayer } from "@deck.gl/layers";
import { TabType, ProvinceData, getTabValue, getMismatch } from "./mockData";

const GEO_URL =
  "https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2012/json/provinces-geo-simple.json";

const FULL_TO_SHORT: Record<string, string> = {
  서울특별시: "서울", 부산광역시: "부산", 대구광역시: "대구",
  인천광역시: "인천", 광주광역시: "광주", 대전광역시: "대전",
  울산광역시: "울산", 세종특별자치시: "세종", 경기도: "경기",
  강원도: "강원", 강원특별자치도: "강원", 충청북도: "충북",
  충청남도: "충남", 전라북도: "전북", 전북특별자치도: "전북",
  전라남도: "전남", 경상북도: "경북", 경상남도: "경남",
  제주특별자치도: "제주",
};

const INITIAL_VIEW = {
  longitude: 127.9,
  latitude: 36.3,
  zoom: 6.2,
  pitch: 30,
  bearing: 0,
  minZoom: 4.5,
  maxPitch: 80,
};

// 디자인용 기본 고도 + 지역별 미세 등고차 (데이터와 무관)
const BASE_ELEVATION = 12000;
const DESIGN_OFFSET: Record<string, number> = {
  서울: 2000, 경기: 1200, 인천: 1600,
  부산: 2500, 울산: 2200, 경남: 1800,
  대구: 2000, 경북: 2800, 강원: 3200,
  대전: 1500, 충북: 2000, 충남: 1800, 세종: 1000,
  광주: 1600, 전북: 2200, 전남: 2600,
  제주: 3000,
};

type RGB = [number, number, number];

function lerp(t: number, a: RGB, b: RGB): RGB {
  return [
    Math.round(a[0] + t * (b[0] - a[0])),
    Math.round(a[1] + t * (b[1] - a[1])),
    Math.round(a[2] + t * (b[2] - a[2])),
  ];
}

function heatRgb(t: number, tab: TabType): RGB {
  if (tab === "mismatch") {
    const blue: RGB = [59, 130, 246];
    const yellow: RGB = [250, 204, 21];
    const red: RGB = [239, 68, 68];
    return t < 0.5 ? lerp(t * 2, blue, yellow) : lerp((t - 0.5) * 2, yellow, red);
  }
  return lerp(t, [219, 234, 254], [29, 78, 216]);
}

interface TooltipState {
  x: number;
  y: number;
  shortName: string;
}

interface KoreaMap3DProps {
  data: ProvinceData[];
  tab: TabType;
  height?: number;
}

export default function KoreaMap3D({ data, tab, height = 500 }: KoreaMap3DProps) {
  const [viewState, setViewState] = useState(INITIAL_VIEW);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const dataMap = Object.fromEntries(data.map((d) => [d.shortName, d]));
  const values = data.map((d) => getTabValue(d, tab));
  const min = Math.min(...values);
  const max = Math.max(...values);

  const getDesignElevation = (f: { properties?: { name?: string } }) => {
    const short = FULL_TO_SHORT[f.properties?.name ?? ""] ?? "";
    return BASE_ELEVATION + (DESIGN_OFFSET[short] ?? 1500);
  };

  const sharedProps = {
    data: GEO_URL,
    extruded: true,
    getElevation: getDesignElevation,
  };

  // 레이어 1: 색상 채우기 (경계선 없음)
  const fillLayer = new GeoJsonLayer({
    ...sharedProps,
    id: "korea-fill",
    filled: true,
    stroked: false,
    wireframe: false,
    pickable: true,
    autoHighlight: true,
    highlightColor: [255, 255, 255, 50],
    material: {
      ambient: 0.4,
      diffuse: 0.65,
      shininess: 48,
      specularColor: [200, 220, 255],
    },
    getFillColor: (f: { properties?: { name?: string } }) => {
      const short = FULL_TO_SHORT[f.properties?.name ?? ""] ?? "";
      const d = dataMap[short];
      if (!d) return [40, 45, 70, 200];
      const t = max === min ? 0 : (getTabValue(d, tab) - min) / (max - min);
      return [...heatRgb(t, tab), 235];
    },
    onHover: (info: { object?: { properties?: { name?: string } }; x: number; y: number }) => {
      if (info.object) {
        const short = FULL_TO_SHORT[info.object.properties?.name ?? ""] ?? "";
        if (short) setTooltip({ x: info.x, y: info.y, shortName: short });
        else setTooltip(null);
      } else {
        setTooltip(null);
      }
    },
    updateTriggers: { getFillColor: [tab, min, max] },
    transitions: { getFillColor: { duration: 500 } },
  });

  // 레이어 2: 경계선 전용 wireframe — 면 위에 올바르게 그려짐
  const wireLayer = new GeoJsonLayer({
    ...sharedProps,
    id: "korea-wire",
    filled: false,
    stroked: false,
    wireframe: true,
    pickable: false,
    getLineColor: [255, 255, 255, 210],
    lineWidthMinPixels: 1.5,
  });

  const tooltipData = tooltip ? dataMap[tooltip.shortName] : null;
  const mismatchVal = tooltipData
    ? getMismatch(tooltipData.jobs, tooltipData.seekers)
    : 0;
  const mismatchColor =
    mismatchVal >= 60 ? "#f87171" : mismatchVal >= 30 ? "#fbbf24" : "#34d399";

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden"
      style={{ height, background: "#070d1f" }}
    >
      <DeckGL
        viewState={viewState}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onViewStateChange={({ viewState: vs }: any) => setViewState(vs)}
        controller
        layers={[fillLayer, wireLayer]}
      />

      {/* 배경 글로우 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 90%, rgba(30,58,138,0.18) 0%, transparent 65%)",
        }}
      />

      {/* 3D 툴팁 */}
      {tooltip && tooltipData && (
        <div
          className="absolute z-20 pointer-events-none"
          style={{
            left: tooltip.x + 16,
            top: Math.max(8, tooltip.y - 160),
            // 3D 부유 카드 효과
            transform: "perspective(600px) rotateX(4deg) rotateY(-2deg)",
            transformOrigin: "bottom left",
          }}
        >
          {/* 카드 본체 */}
          <div
            style={{
              background:
                "linear-gradient(145deg, rgba(15,23,42,0.96) 0%, rgba(23,37,84,0.94) 100%)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "16px",
              boxShadow:
                "0 32px 64px rgba(0,0,0,0.6), 0 8px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)",
              padding: "16px 20px",
              minWidth: "200px",
            }}
          >
            {/* 상단 하이라이트 라인 */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: "20%",
                right: "20%",
                height: "1px",
                background:
                  "linear-gradient(to right, transparent, rgba(255,255,255,0.3), transparent)",
                borderRadius: "999px",
              }}
            />

            <p
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: "#f1f5f9",
                marginBottom: "10px",
                letterSpacing: "0.01em",
              }}
            >
              {tooltipData.fullName}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {[
                { label: "채용공고", value: `${tooltipData.jobs.toLocaleString()}건`, color: "#93c5fd" },
                { label: "직무종사자", value: `${tooltipData.workers.toLocaleString()}명`, color: "#86efac" },
                { label: "희망 청년", value: `${tooltipData.seekers.toLocaleString()}명`, color: "#fde68a" },
              ].map((row) => (
                <div
                  key={row.label}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "24px" }}
                >
                  <span style={{ fontSize: "11px", color: "#64748b" }}>{row.label}</span>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: row.color }}>{row.value}</span>
                </div>
              ))}

              {/* 구분선 */}
              <div style={{ height: "1px", background: "rgba(255,255,255,0.06)", margin: "4px 0" }} />

              {/* 미스매치 강조 */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "11px", color: "#64748b" }}>미스매치 지수</span>
                <span
                  style={{
                    fontSize: "15px",
                    fontWeight: 800,
                    color: mismatchColor,
                    textShadow: `0 0 12px ${mismatchColor}80`,
                  }}
                >
                  {mismatchVal}%
                </span>
              </div>
            </div>
          </div>

          {/* 카드 아래 그림자 (입체감) */}
          <div
            style={{
              position: "absolute",
              bottom: "-12px",
              left: "10%",
              right: "10%",
              height: "12px",
              background: "rgba(0,0,0,0.35)",
              filter: "blur(8px)",
              borderRadius: "50%",
            }}
          />
        </div>
      )}

      {/* 범례 */}
      <div className="absolute bottom-4 left-4 flex items-center gap-2">
        <span className="text-xs text-gray-600">낮음</span>
        <div
          className="h-1.5 w-20 rounded-full"
          style={{
            background:
              tab === "mismatch"
                ? "linear-gradient(to right, #3B82F6, #FACC15, #EF4444)"
                : "linear-gradient(to right, #DBEAFE, #1D4ED8)",
          }}
        />
        <span className="text-xs text-gray-600">높음</span>
      </div>

      <div className="absolute bottom-4 right-4 text-xs text-gray-700">
        드래그 · 회전 · 스크롤
      </div>
    </div>
  );
}
