// app/analysis/AnalysisClient.tsx
"use client";

import { useMemo, useState } from "react";

type MarketSummary = {
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  medianPrice: number;
  totalCount: number;
};

type PropertyRecord = {
  price: number;
  squareFootage: number;
  bedrooms: number;
  bathrooms: number;
  yearBuilt: number;
  lotSize: number;
  distanceToCityCenter: number;
  schoolRating: number;
};

type WhatIfRequest = {
  squareFootage: number;
  bedrooms: number;
  bathrooms: number;
  yearBuilt: number;
  lotSize: number;
  distanceToCityCenter: number;
  schoolRating: number;
};

type WhatIfResponse = {
  predictedPrice: number;
  marketAverage: number;
  differenceFromAverage: number;
};

type SortKey = keyof PropertyRecord | "none";

type AnalysisClientProps = {
  initialSummary: MarketSummary;
  initialSegments: PropertyRecord[];
};

export default function AnalysisClient({
  initialSummary,
  initialSegments,
}: AnalysisClientProps) {
  const [summary] = useState<MarketSummary | null>(initialSummary ?? null);
  const [segments, setSegments] = useState<PropertyRecord[]>(
    initialSegments ?? []
  );
  const [error, setError] = useState<string | null>(null);
  const [loadingSegments, setLoadingSegments] = useState(false);

  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [minBedrooms, setMinBedrooms] = useState<string>("");
  const [maxBedrooms, setMaxBedrooms] = useState<string>("");
  const [minSchool, setMinSchool] = useState<string>("");
  const [maxSchool, setMaxSchool] = useState<string>("");

  const [sortKey, setSortKey] = useState<SortKey>("none");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const [whatIf, setWhatIf] = useState<WhatIfRequest>({
    squareFootage: 1500,
    bedrooms: 3,
    bathrooms: 2,
    yearBuilt: 2005,
    lotSize: 5000,
    distanceToCityCenter: 5,
    schoolRating: 7,
  });
  const [whatIfResult, setWhatIfResult] = useState<WhatIfResponse | null>(null);
  const [whatIfError, setWhatIfError] = useState<string | null>(null);
  const [loadingWhatIf, setLoadingWhatIf] = useState(false);

  // ---- Segments filtering ----
  const loadSegments = async () => {
    setLoadingSegments(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (minPrice) params.append("minPrice", minPrice);
      if (maxPrice) params.append("maxPrice", maxPrice);
      if (minBedrooms) params.append("minBedrooms", minBedrooms);
      if (maxBedrooms) params.append("maxBedrooms", maxBedrooms);
      if (minSchool) params.append("minSchoolRating", minSchool);
      if (maxSchool) params.append("maxSchoolRating", maxSchool);

      const url = `http://localhost:8080/market/segments?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load market segments");
      const data = (await res.json()) as PropertyRecord[];
      setSegments(data);
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoadingSegments(false);
    }
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
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

  // ---- What-if analysis ----
  const handleWhatIfChange = (field: keyof WhatIfRequest, value: string) => {
    const num = value === "" ? NaN : Number(value);
    setWhatIf((prev) => ({
      ...prev,
      [field]: num,
    }));
  };

  const runWhatIf = async (e: React.FormEvent) => {
    e.preventDefault();
    setWhatIfError(null);
    setWhatIfResult(null);
    setLoadingWhatIf(true);
    try {
      const res = await fetch("http://localhost:8080/market/what-if", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(whatIf),
      });
      if (!res.ok) {
        const detail = await res.text();
        throw new Error(detail || "What-if request failed");
      }
      const data = (await res.json()) as WhatIfResponse;
      setWhatIfResult(data);
    } catch (err: any) {
      setWhatIfError(err.message || "Unknown error");
    } finally {
      setLoadingWhatIf(false);
    }
  };

  // ---- Export helpers ----
  const downloadCsv = () => {
    window.open("http://localhost:8080/market/export?type=csv", "_blank");
  };

  const downloadPdf = () => {
    window.open("http://localhost:8080/market/export?type=pdf", "_blank");
  };

  const formatMoney = (v: number) =>
    v >= 1_000_000
      ? `$${(v / 1_000_000).toFixed(1)}M`
      : v >= 1_000
      ? `$${(v / 1_000).toFixed(0)}k`
      : `$${v.toFixed(0)}`;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Market Analysis</h1>
      <p className="text-sm text-slate-600">
        This dashboard is powered by the Java Spring Boot analysis API. It
        exposes market summary statistics, filtered segments, a what-if analysis
        tool that integrates with the Python ML container, and data export
        options.
      </p>

      {error && (
        <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Summary cards */}
      <section className="grid gap-3 md:grid-cols-4">
        <div className="rounded border bg-white px-3 py-2 text-sm">
          <div className="text-xs text-slate-500">Average Price</div>
          <div className="text-lg font-semibold">
            {summary ? formatMoney(summary.avgPrice) : "…"}
          </div>
        </div>
        <div className="rounded border bg-white px-3 py-2 text-sm">
          <div className="text-xs text-slate-500">Median Price</div>
          <div className="text-lg font-semibold">
            {summary ? formatMoney(summary.medianPrice) : "…"}
          </div>
        </div>
        <div className="rounded border bg-white px-3 py-2 text-sm">
          <div className="text-xs text-slate-500">Min Price</div>
          <div className="text-lg font-semibold">
            {summary ? formatMoney(summary.minPrice) : "…"}
          </div>
        </div>
        <div className="rounded border bg-white px-3 py-2 text-sm">
          <div className="text-xs text-slate-500">Max Price</div>
          <div className="text-lg font-semibold">
            {summary ? formatMoney(summary.maxPrice) : "…"}
          </div>
        </div>
      </section>

      {/* Filters + export */}
      <section className="space-y-3 rounded border bg-white p-4 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">Filter Property Segments</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={downloadCsv}
              className="rounded border px-2 py-1 text-xs hover:bg-slate-50"
            >
              Export CSV
            </button>
            <button
              type="button"
              onClick={downloadPdf}
              className="rounded border px-2 py-1 text-xs hover:bg-slate-50"
            >
              Export PDF
            </button>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            loadSegments();
          }}
          className="grid gap-3 md:grid-cols-3"
        >
          <div className="flex flex-col gap-1">
            <span>Price range</span>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full rounded border px-2 py-1"
              />
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full rounded border px-2 py-1"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span>Bedrooms</span>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={minBedrooms}
                onChange={(e) => setMinBedrooms(e.target.value)}
                className="w-full rounded border px-2 py-1"
              />
              <input
                type="number"
                placeholder="Max"
                value={maxBedrooms}
                onChange={(e) => setMaxBedrooms(e.target.value)}
                className="w-full rounded border px-2 py-1"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span>School rating</span>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={minSchool}
                onChange={(e) => setMinSchool(e.target.value)}
                className="w-full rounded border px-2 py-1"
              />
              <input
                type="number"
                placeholder="Max"
                value={maxSchool}
                onChange={(e) => setMaxSchool(e.target.value)}
                className="w-full rounded border px-2 py-1"
              />
            </div>
          </div>

          <div className="md:col-span-3 flex gap-2">
            <button
              type="submit"
              className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              disabled={loadingSegments}
            >
              {loadingSegments ? "Loading…" : "Apply filters"}
            </button>
            <button
              type="button"
              className="rounded border px-3 py-1 text-xs hover:bg-slate-50"
              onClick={() => {
                setMinPrice("");
                setMaxPrice("");
                setMinBedrooms("");
                setMaxBedrooms("");
                setMinSchool("");
                setMaxSchool("");
                loadSegments();
              }}
            >
              Reset
            </button>
          </div>
        </form>
      </section>

      {/* What-if analysis + segments */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded border bg-white p-4 text-xs">
          <h2 className="mb-2 text-sm font-semibold">What-if Analysis</h2>
          <p className="mb-3 text-slate-600">
            This form sends a what-if request to the Spring Boot API, which in
            turn calls the Python estimator service to get a predicted price and
            compares it to the current market average.
          </p>

          {whatIfError && (
            <div className="mb-2 rounded border border-red-300 bg-red-50 px-2 py-1 text-xs text-red-700">
              {whatIfError}
            </div>
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
                  {field
                    .replace(/([A-Z])/g, " $1")
                    .replace(/_/g, " ")
                    .toLowerCase()}
                </span>
                <input
                  type="number"
                  step={field === "bathrooms" ? "0.5" : "1"}
                  value={
                    Number.isNaN(whatIf[field]) ? "" : (whatIf[field] as number)
                  }
                  onChange={(e) => handleWhatIfChange(field, e.target.value)}
                  className="rounded border px-2 py-1"
                />
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
                Predicted price:{" "}
                <span className="font-semibold">
                  {formatMoney(whatIfResult.predictedPrice)}
                </span>
              </div>
              <div>
                Market average:{" "}
                <span className="font-semibold">
                  {formatMoney(whatIfResult.marketAverage)}
                </span>
              </div>
              <div>
                Difference:{" "}
                <span
                  className={
                    whatIfResult.differenceFromAverage >= 0
                      ? "font-semibold text-green-600"
                      : "font-semibold text-red-600"
                  }
                >
                  {whatIfResult.differenceFromAverage >= 0 ? "+" : ""}
                  {formatMoney(whatIfResult.differenceFromAverage)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Segments table */}
        <div className="rounded border bg-white p-4 text-xs">
          <h2 className="mb-2 text-sm font-semibold">
            Property Segments ({segments.length})
          </h2>
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
                      {sortKey === key && (
                        <span>{sortDir === "asc" ? " ▲" : " ▼"}</span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedSegments.map((p, idx) => (
                  <tr
                    key={idx}
                    className="odd:bg-white even:bg-slate-50 hover:bg-blue-50"
                  >
                    <td className="border-b px-2 py-1">
                      {formatMoney(p.price)}
                    </td>
                    <td className="border-b px-2 py-1">
                      {p.squareFootage}
                    </td>
                    <td className="border-b px-2 py-1">
                      {p.bedrooms}
                    </td>
                    <td className="border-b px-2 py-1">
                      {p.bathrooms}
                    </td>
                    <td className="border-b px-2 py-1">
                      {p.yearBuilt}
                    </td>
                    <td className="border-b px-2 py-1">
                      {p.lotSize}
                    </td>
                    <td className="border-b px-2 py-1">
                      {p.distanceToCityCenter}
                    </td>
                    <td className="border-b px-2 py-1">
                      {p.schoolRating}
                    </td>
                  </tr>
                ))}
                {sortedSegments.length === 0 && (
                  <tr>
                    <td
                      className="border-b px-2 py-2 text-center text-slate-500"
                      colSpan={8}
                    >
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
