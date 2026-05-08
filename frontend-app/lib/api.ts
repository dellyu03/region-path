const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface RegionCount {
  region: string;
  code: string;
  count: number;
}

export interface TrendCountsResponse {
  job_group: string;
  label: string;
  regions: RegionCount[];
  cached: boolean;
}

export async function fetchTrendCounts(jobGroup: string): Promise<TrendCountsResponse> {
  const res = await fetch(`${API_BASE}/api/trend/counts?job_group=${jobGroup}`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

export async function fetchJobGroups(): Promise<{ id: string; label: string }[]> {
  const res = await fetch(`${API_BASE}/api/trend/groups`);
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

export interface DistrictEmployment {
  district: string;
  code: string;
  new_jobs: number;
  new_seekers: number;
  employed: number;
}

export interface SeoulEmploymentResponse {
  year_month: string;
  sex: string;
  sex_label: string;
  age: string;
  age_label: string;
  districts: DistrictEmployment[];
  cached: boolean;
}

export async function fetchSeoulEmployment(
  yearMonth = "202601",
  sex = "M",
  age = "02"
): Promise<SeoulEmploymentResponse> {
  const res = await fetch(
    `${API_BASE}/api/employment/seoul?year_month=${yearMonth}&sex=${sex}&age=${age}`
  );
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

export interface BusinessRegion {
  shortName: string;
  fullName: string;
  count: number;
}

export interface NationalBusinessResponse {
  year: string;
  source: string;
  regions: BusinessRegion[];
}

export async function fetchNationalBusiness(): Promise<NationalBusinessResponse> {
  const res = await fetch(`${API_BASE}/api/employment/business`);
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}
