import { MarketFilter } from "./types";

/**
 * Convert MarketFilter to a query string.
 * Keeps URL shareable/bookmarkable, and lets the Server Component refetch data.
 */
export function toQuery(filter: MarketFilter): string {
  const p = new URLSearchParams();

  if (filter.minPrice) p.set("minPrice", filter.minPrice);
  if (filter.maxPrice) p.set("maxPrice", filter.maxPrice);
  if (filter.minBedrooms) p.set("minBedrooms", filter.minBedrooms);
  if (filter.maxBedrooms) p.set("maxBedrooms", filter.maxBedrooms);
  if (filter.minSchoolRating) p.set("minSchoolRating", filter.minSchoolRating);
  if (filter.maxSchoolRating) p.set("maxSchoolRating", filter.maxSchoolRating);

  const s = p.toString();
  return s ? `?${s}` : "";
}

/**
 * Merge + normalize filter values from Next.js searchParams object.
 * Accepts strings or string[] and returns a MarketFilter with only string fields.
 */
export function filterFromSearchParams(
  searchParams: Record<string, string | string[] | undefined>
) {
  const pick = (k: string) => (typeof searchParams[k] === "string" ? (searchParams[k] as string) : undefined);

  return {
    minPrice: pick("minPrice"),
    maxPrice: pick("maxPrice"),
    minBedrooms: pick("minBedrooms"),
    maxBedrooms: pick("maxBedrooms"),
    minSchoolRating: pick("minSchoolRating"),
    maxSchoolRating: pick("maxSchoolRating"),
  };
}
