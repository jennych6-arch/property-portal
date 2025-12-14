"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  GroupedStatistic,
  MarketFilter,
  MarketSummary,
  PropertyRecord,
  WhatIfRequest,
  WhatIfResponse,
} from "./_lib/types";
import { toQuery } from "./_lib/query";
import { hasErrors, validateWhatIf, FieldErrors } from "./_hooks/useWhatIfValidation";

type SortKey = keyof PropertyRecord | "none";

type AnalysisClientProps = {
  initialFilter: MarketFilter;
  initialSummary: MarketSummary;
  initialSegments: PropertyRecord[];
  initialGroups: GroupedStatistic[];
};

const CLIENT_API_BASE =
  process.env.NEXT_PUBLIC_ANALYSIS_API_BASE_URL ?? "http://localhost:8080";

export default function AnalysisClient({
  initialFilter,
  initialSummary,
  initialSegments,
  initialGroups,
}: AnalysisClientProps) {
  const router = useRouter();

  // Keep client state in sync with server-provided props on navigation/filter changes.
  const [summary, setSummary] = useState<MarketSummary>(initialSummary);
  const [segments, setSegments] = useState<PropertyRecord[]>(initialSegments);
  const [groupedStats, setGroupedStats] = useState<GroupedStatistic[]>(initialGroups);

  useEffect(() => setSummary(initialSummary), [initialSummary]);
  useEffect(() => setSegments(initialSegments), [initialSegments]);
  useEffect(() => setGroupedStats(initialGroups), [initialGroups]);

  // ---- Filter form state (client-only) ----
  const [minPrice, setMinPrice] = useState<string>(initialFilter.minPrice ?? "");
  const [maxPrice, setMaxPrice] = useState<string>(initialFilter.maxPrice ?? "");
  const [minBedrooms, setMinBedrooms] = useState<string>(initialFilter.minBedrooms ?? "");
  const [maxBedrooms, setMaxBedrooms] = useState<string>(initialFilter.maxBedrooms ?? "");
  const [minSchool, setMinSchool] = useState<string>(initialFilter.minSchoolRating ?? "");
  const [maxSchool, setMaxSchool] = useState<string>(initialFilter.maxSchoolRating ?? "");

  // If user navigates (back/forward) and initialFilter changes, sync inputs.
  useEffect(() => {
    setMinPrice(initialFilter.minPrice ?? "");
    setMaxPrice(initialFilter.maxPrice ?? "");
    setMinBedrooms(initialFilter.minBedrooms ?? "");
    setMaxBedrooms(initialFilter.maxBedrooms ?? "");
    setMinSchool(initialFilter.minSchoolRating ?? "");
    setMaxSchool(initialFilter.maxSchoolRating ?? "");
  }, [initialFilter]);

  const applyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    const next: MarketFilter = {
      minPrice: minPrice || undefined,
      maxPrice: maxPrice || undefined,
      minBedrooms: minBedrooms || undefined,
      maxBedrooms: maxBedrooms || undefined,
      minSchoolRating: minSchool || undefined,
      maxSchoolRating: maxSchool || undefined,
    };
    router.push(`/analysis${toQuery(next)}`);
  };

  const resetFilters = () => {
    router.push("/analysis");
  };

  // ---- Sorting (table) ----
  const [sortKey, setSortKey] = useState<SortKey>("none");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sortedSegments = useMemo(() => {
    if (sortKey === "none") return segments;
    const copied = [...segments];
    copied.sort((a, b) => {
      const av = a[sortKey as keyof PropertyRecord] as number;
      const bv = b[sortKey as keyof PropertyRecord] as number;
      return sortDir === "asc" ? av - bv : bv - av;
    });
    return copied;
  }, [segments, sortKey, sortDir]);

  // ---- Grouped chart scaling ----
  const maxAvgPrice = useMemo(
    () => groupedStats.reduce((max, g) => (g.averagePrice > max ? g.averagePrice : max), 0),
    [groupedStats]
  );

  // ---- What-if analysis (client) + validation ----
  const [whatIf, setWhatIf] = useState<WhatIfRequest>({
    squareFootage: 1500,
    bedrooms: 3,
    bathrooms: 2,
    yearBuilt: 2005,
    lotSize: 5000,
    distanceToCityCenter: 5,
    schoolRating: 7,
  });

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [whatIfResult, setWhatIfResult] = useState<WhatIfResponse | null>(null);
  const [whatIfError, setWhatIfError] = useState<string | null>(null);
  const [loadingWhatIf, setLoadingWhatIf] = useState(false);

  const handleWhatIfChange = (field: keyof WhatIfRequest, value: string) => {
    const num = value === "" ? NaN : Number(value);
    setWhatIf((prev) => ({ ...prev, [field]: num }));
    // Clear error on edit for better UX
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const runWhatIf = async (e: React.FormEvent) => {
    e.preventDefault();
    setWhatIfError(null);
    setWhatIfResult(null);

    const errors = validateWhatIf(whatIf);
    setFieldErrors(errors);
    if (hasErrors(errors)) {
      setWhatIfError("Please fix the highlighted fields before running what-if.");
      return;
    }

    setLoadingWhatIf(true);
    try {
      const res = await fetch(`${CLIENT_API_BASE}/market/what-if`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(whatIf),
      });

      if (!res.ok) {
        let message = "What-if request failed";

        try {
          const errJson = await res.json();
          message = errJson.message || errJson.reason || errJson.error || message;
        } catch {
          const text = await res.text();
          if (text) message = text;
        }

        throw new Error(message);
      }



      const data = (await res.json()) as WhatIfResponse;
      setWhatIfResult(data);
    } catch (err: any) {
      setWhatIfError(err?.message || "Unknown error");
    } finally {
      setLoadingWhatIf(false);
    }
  };

  // ---- Export helpers (include current filters) ----
  const currentFilterQuery = useMemo(() => {
    const next: MarketFilter = {
      minPrice: minPrice || undefined,
      maxPrice: maxPrice || undefined,
      minBedrooms: minBedrooms || undefined,
      maxBedrooms: maxBedrooms || undefined,
      minSchoolRating: minSchool || undefined,
      maxSchoolRating: maxSchool || undefined,
    };
    // toQuery includes leading "?"
    return toQuery(next);
  }, [minPrice, maxPrice, minBedrooms, maxBedrooms, minSchool, maxSchool]);

  const downloadCsv = () => {
    window.open(`${CLIENT_API_BASE}/market/export${currentFilterQuery}&type=csv`.replace("?&", "?"), "_blank");
  };

  const downloadPdf = () => {
    window.open(`${CLIENT_API_BASE}/market/export${currentFilterQuery}&type=pdf`.replace("?&", "?"), "_blank");
  };

  const formatMoney = (v: number) =>
    v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : v >= 1_000 ? `$${(v / 1_000).toFixed(0)}k` : `$${v.toFixed(0)}`;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Market Analysis</h1>
      <p className="text-sm text-slate-600">
        Server Component loads initial summary/segments/grouped stats. Client Components handle filters, sorting, what-if validation, and downloads.
      </p>

      {/* Summary cards */}
      <section className="grid gap-3 md:grid-cols-4">
        <div className="rounded border bg-white px-3 py-2 text-sm">
          <div className="text-xs text-slate-500">Average Price</div>
          <div className="text-lg font-semibold">{summary ? formatMoney(summary.avgPrice) : "…"}</div>
        </div>
        <div className="rounded border bg-white px-3 py-2 text-sm">
          <div className="text-xs text-slate-500">Median Price</div>
          <div className="text-lg font-semibold">{summary ? formatMoney(summary.medianPrice) : "…"}</div>
        </div>
        <div className="rounded border bg-white px-3 py-2 text-sm">
          <div className="text-xs text-slate-500">Min Price</div>
          <div className="text-lg font-semibold">{summary ? formatMoney(summary.minPrice) : "…"}</div>
        </div>
        <div className="rounded border bg-white px-3 py-2 text-sm">
          <div className="text-xs text-slate-500">Max Price</div>
          <div className="text-lg font-semibold">{summary ? formatMoney(summary.maxPrice) : "…"}</div>
        </div>
      </section>

      {/* Filters + export (client) */}
      <section className="space-y-3 rounded border bg-white p-4 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">Filter Property Segments</h2>
          <div className="flex gap-2">
            <button type="button" onClick={downloadCsv} className="rounded border px-2 py-1 text-xs hover:bg-slate-50">
              Export CSV
            </button>
            <button type="button" onClick={downloadPdf} className="rounded border px-2 py-1 text-xs hover:bg-slate-50">
              Export PDF
            </button>
          </div>
        </div>

        <form onSubmit={applyFilters} className="grid gap-3 md:grid-cols-3">
          <div className="flex flex-col gap-1">
            <span>Price range</span>
            <div className="flex gap-2">
              <input type="number" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="w-full rounded border px-2 py-1" />
              <input type="number" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="w-full rounded border px-2 py-1" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span>Bedrooms</span>
            <div className="flex gap-2">
              <input type="number" placeholder="Min" value={minBedrooms} onChange={(e) => setMinBedrooms(e.target.value)} className="w-full rounded border px-2 py-1" />
              <input type="number" placeholder="Max" value={maxBedrooms} onChange={(e) => setMaxBedrooms(e.target.value)} className="w-full rounded border px-2 py-1" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span>School rating</span>
            <div className="flex gap-2">
              <input type="number" placeholder="Min" value={minSchool} onChange={(e) => setMinSchool(e.target.value)} className="w-full rounded border px-2 py-1" />
              <input type="number" placeholder="Max" value={maxSchool} onChange={(e) => setMaxSchool(e.target.value)} className="w-full rounded border px-2 py-1" />
            </div>
          </div>

          <div className="md:col-span-3 flex gap-2">
            <button type="submit" className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700">
              Apply filters
            </button>
            <button type="button" className="rounded border px-3 py-1 text-xs hover:bg-slate-50" onClick={resetFilters}>
              Reset
            </button>
          </div>
        </form>
      </section>

      {/* Grouped statistics chart */}
      {groupedStats.length > 0 && (
        <section className="rounded border bg-white p-4 text-xs">
          <h2 className="mb-2 text-sm font-semibold">Average Price by Bedrooms</h2>
          <p className="mb-3 text-slate-600">
            Each bar shows the average price for properties with the given number of bedrooms. Server refetches data when filters change.
          </p>
          <div className="space-y-2">
            {groupedStats.map((g) => (
              <div key={g.label} className="flex items-center gap-2">
                <div className="w-10 text-right font-medium">{g.label} BR</div>
                <div className="flex-1 h-3 rounded bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded bg-blue-500"
                    style={{ width: maxAvgPrice > 0 ? `${(g.averagePrice / maxAvgPrice) * 100}%` : "0%" }}
                  />
                </div>
                <div className="w-24 text-right">{formatMoney(g.averagePrice)}</div>
                <div className="w-20 text-right text-[10px] text-slate-500">{g.count} homes</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* What-if analysis + segments */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded border bg-white p-4 text-xs">
          <h2 className="mb-2 text-sm font-semibold">What-if Analysis</h2>
          <p className="mb-3 text-slate-600">
            Client-side validation runs before submitting. The Spring Boot API calls the Python estimator service.
          </p>

          {whatIfError && (
            <div className="mb-2 rounded border border-red-300 bg-red-50 px-2 py-1 text-xs text-red-700">{whatIfError}</div>
          )}

          <form onSubmit={runWhatIf} className="grid gap-2 md:grid-cols-2">
            {(
              [
                "squareFootage",
                "bedrooms",
                "bathrooms",
                "yearBuilt",
                "lotSize",
                "distanceToCityCenter",
                "schoolRating",
              ] as (keyof WhatIfRequest)[]
            ).map((field) => (
              <label key={field} className="flex flex-col gap-1">
                <span className="capitalize">
                  {field.replace(/([A-Z])/g, " $1").replace(/_/g, " ").toLowerCase()}
                </span>
                <input
                  type="number"
                  step={field === "bathrooms" ? "0.5" : "1"}
                  value={Number.isNaN(whatIf[field]) ? "" : (whatIf[field] as number)}
                  onChange={(e) => handleWhatIfChange(field, e.target.value)}
                  className={`rounded border px-2 py-1 ${fieldErrors[field] ? "border-red-400" : ""}`}
                />
                {fieldErrors[field] && <span className="text-[10px] text-red-600">{fieldErrors[field]}</span>}
              </label>
            ))}

            <div className="md:col-span-2 mt-2">
              <button
                type="submit"
                disabled={loadingWhatIf}
                className="rounded bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {loadingWhatIf ? "Calculating…" : "Run what-if"}
              </button>
            </div>
          </form>

          {whatIfResult && (
            <div className="mt-3 rounded border bg-slate-50 px-3 py-2 text-xs">
              <div>
                Predicted price: <span className="font-semibold">{formatMoney(whatIfResult.predictedPrice)}</span>
              </div>
              <div>
                Market average: <span className="font-semibold">{formatMoney(whatIfResult.marketAverage)}</span>
              </div>
              <div>
                Difference:{" "}
                <span className={whatIfResult.differenceFromAverage >= 0 ? "font-semibold text-green-600" : "font-semibold text-red-600"}>
                  {whatIfResult.differenceFromAverage >= 0 ? "+" : ""}
                  {formatMoney(whatIfResult.differenceFromAverage)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Segments table */}
        <div className="rounded border bg-white p-4 text-xs">
          <h2 className="mb-2 text-sm font-semibold">Property Segments ({segments.length})</h2>
          <div className="overflow-x-auto max-h-80">
            <table className="min-w-full border-collapse">
              <thead className="bg-slate-50 text-slate-600 sticky top-0">
                <tr>
                  {[
                    ["price", "Price"],
                    ["squareFootage", "Sq Ft"],
                    ["bedrooms", "Bed"],
                    ["bathrooms", "Bath"],
                    ["yearBuilt", "Year"],
                    ["lotSize", "Lot"],
                    ["distanceToCityCenter", "Dist"],
                    ["schoolRating", "School"],
                  ].map(([key, label]) => (
                    <th
                      key={key}
                      className="border-b px-2 py-1 text-left cursor-pointer"
                      onClick={() => toggleSort(key as SortKey)}
                    >
                      {label}
                      {sortKey === key && <span>{sortDir === "asc" ? " ▲" : " ▼"}</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedSegments.map((p, idx) => (
                  <tr key={idx} className="odd:bg-white even:bg-slate-50 hover:bg-blue-50">
                    <td className="border-b px-2 py-1">{formatMoney(p.price)}</td>
                    <td className="border-b px-2 py-1">{p.squareFootage}</td>
                    <td className="border-b px-2 py-1">{p.bedrooms}</td>
                    <td className="border-b px-2 py-1">{p.bathrooms}</td>
                    <td className="border-b px-2 py-1">{p.yearBuilt}</td>
                    <td className="border-b px-2 py-1">{p.lotSize}</td>
                    <td className="border-b px-2 py-1">{p.distanceToCityCenter}</td>
                    <td className="border-b px-2 py-1">{p.schoolRating}</td>
                  </tr>
                ))}
                {sortedSegments.length === 0 && (
                  <tr>
                    <td className="border-b px-2 py-2 text-center text-slate-500" colSpan={8}>
                      No properties match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
