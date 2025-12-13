// app/analysis/page.tsx
import AnalysisClient from "./AnalysisClient";

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

async function fetchSummary(): Promise<MarketSummary> {
  const res = await fetch("http://localhost:8080/market/summary", {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to load market summary");
  }

  return res.json();
}

async function fetchSegments(): Promise<PropertyRecord[]> {
  const res = await fetch("http://localhost:8080/market/segments", {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to load market segments");
  }

  return res.json();
}

export default async function AnalysisPage() {
  const [summary, segments] = await Promise.all([
    fetchSummary(),
    fetchSegments(),
  ]);

  return (
    <AnalysisClient initialSummary={summary} initialSegments={segments} />
  );
}
