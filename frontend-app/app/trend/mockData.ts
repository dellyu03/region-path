export type TabType = "jobs" | "workers" | "mismatch";

export interface JobCategory {
  id: string;
  label: string;
}

export interface ProvinceData {
  shortName: string;
  fullName: string;
  jobs: number;
  workers: number;
  seekers: number;
}

export const jobCategories: JobCategory[] = [
  { id: "it",       label: "IT/소프트웨어 개발" },
  { id: "media",    label: "미디어/콘텐츠/디자인" },
  { id: "business", label: "경영/행정/사무직" },
];

const provinceBase = [
  { shortName: "서울", fullName: "서울특별시",    popM: 9.7  },
  { shortName: "부산", fullName: "부산광역시",    popM: 3.4  },
  { shortName: "대구", fullName: "대구광역시",    popM: 2.4  },
  { shortName: "인천", fullName: "인천광역시",    popM: 3.0  },
  { shortName: "광주", fullName: "광주광역시",    popM: 1.5  },
  { shortName: "대전", fullName: "대전광역시",    popM: 1.5  },
  { shortName: "울산", fullName: "울산광역시",    popM: 1.1  },
  { shortName: "세종", fullName: "세종특별자치시", popM: 0.4  },
  { shortName: "경기", fullName: "경기도",        popM: 13.7 },
  { shortName: "강원", fullName: "강원특별자치도", popM: 1.5  },
  { shortName: "충북", fullName: "충청북도",      popM: 1.6  },
  { shortName: "충남", fullName: "충청남도",      popM: 2.2  },
  { shortName: "전북", fullName: "전라북도",      popM: 1.8  },
  { shortName: "전남", fullName: "전라남도",      popM: 1.8  },
  { shortName: "경북", fullName: "경상북도",      popM: 2.6  },
  { shortName: "경남", fullName: "경상남도",      popM: 3.4  },
  { shortName: "제주", fullName: "제주특별자치도", popM: 0.7  },
];

const jobMultipliers: Record<string, Record<string, number>> = {
  it: {
    서울: 4.5, 경기: 2.8, 부산: 1.2, 인천: 1.0,
    대구: 0.7, 광주: 0.6, 대전: 0.8, 울산: 0.5,
    세종: 0.4, 강원: 0.3, 충북: 0.4, 충남: 0.5,
    전북: 0.3, 전남: 0.25, 경북: 0.4, 경남: 0.6, 제주: 0.3,
  },
  media: {
    서울: 5.0, 경기: 2.5, 부산: 1.3, 인천: 0.9,
    대구: 0.8, 광주: 0.7, 대전: 0.7, 울산: 0.5,
    세종: 0.3, 강원: 0.4, 충북: 0.3, 충남: 0.4,
    전북: 0.3, 전남: 0.25, 경북: 0.3, 경남: 0.5, 제주: 0.5,
  },
  business: {
    서울: 4.0, 경기: 3.0, 부산: 1.5, 인천: 1.2,
    대구: 1.0, 광주: 0.8, 대전: 1.0, 울산: 0.8,
    세종: 0.6, 강원: 0.5, 충북: 0.6, 충남: 0.7,
    전북: 0.6, 전남: 0.5, 경북: 0.7, 경남: 0.9, 제주: 0.5,
  },
};

const seekerMultiplier: Record<string, number> = {
  서울: 0.8,  경기: 0.85, 부산: 1.1,  인천: 1.0,
  대구: 1.2,  광주: 1.3,  대전: 1.2,  울산: 1.1,
  세종: 0.9,  강원: 1.6,  충북: 1.5,  충남: 1.4,
  전북: 1.7,  전남: 1.8,  경북: 1.5,  경남: 1.3,  제주: 1.2,
};

const BASE_JOBS_PER_10K    = 50;
const BASE_WORKERS_PER_10K = 480;
const BASE_SEEKERS_PER_10K = 110;

export function getProvinceData(jobId: string): ProvinceData[] {
  const jm = jobMultipliers[jobId] ?? jobMultipliers.it;
  return provinceBase.map((p) => {
    const pop10k = p.popM * 100;
    const jMul  = jm[p.shortName] ?? 1.0;
    const sMul  = seekerMultiplier[p.shortName] ?? 1.3;
    return {
      shortName: p.shortName,
      fullName:  p.fullName,
      jobs:      Math.round(pop10k * BASE_JOBS_PER_10K    * jMul),
      workers:   Math.round(pop10k * BASE_WORKERS_PER_10K * jMul * 0.85),
      seekers:   Math.round(pop10k * BASE_SEEKERS_PER_10K * sMul),
    };
  });
}

export function getMismatch(jobs: number, seekers: number): number {
  if (seekers === 0) return 0;
  return Math.max(0, Math.round(((seekers - jobs) / seekers) * 100));
}

export function getTabValue(d: ProvinceData, tab: TabType): number {
  if (tab === "jobs")    return d.jobs;
  if (tab === "workers") return d.workers;
  return getMismatch(d.jobs, d.seekers);
}
