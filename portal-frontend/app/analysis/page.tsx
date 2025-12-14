import AnalysisClient from "./AnalysisClient";
import { GroupedStatistic, MarketFilter, MarketSummary, PropertyRecord } from "./_lib/types";
import { filterFromSearchParams, toQuery } from "./_lib/query";

const API_BASE = process.env.ANALYSIS_API_BASE_URL ?? "http://localhost:8080";

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Failed to load ${path}${detail ? `: ${detail}` : ""}`);
  }
  return res.json();
}

export default async function AnalysisPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // unwrap the Promise
  const searchParams = await props.searchParams;

  const filter: MarketFilter = filterFromSearchParams(searchParams);
  const q = toQuery(filter);

  const [summary, segments, grouped] = await Promise.all([
    getJson<MarketSummary>(`/market/summary${q}`),
    getJson<PropertyRecord[]>(`/market/segments${q}`),
    getJson<GroupedStatistic[]>(`/market/distribution/bedrooms${q}`),
  ]);

  return (
    <AnalysisClient
      initialFilter={filter}
      initialSummary={summary}
      initialSegments={segments}
      initialGroups={grouped}
    />
  );
}
