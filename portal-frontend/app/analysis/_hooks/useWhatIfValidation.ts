import { WhatIfRequest } from "../_lib/types";

export type FieldErrors = Partial<Record<keyof WhatIfRequest, string>>;

const isFiniteNum = (n: number) => Number.isFinite(n);

export function validateWhatIf(v: WhatIfRequest): FieldErrors {
  const e: FieldErrors = {};
  const thisYear = new Date().getFullYear();

  if (!isFiniteNum(v.squareFootage) || v.squareFootage <= 0) e.squareFootage = "Must be > 0";
  if (!Number.isInteger(v.bedrooms) || v.bedrooms < 0) e.bedrooms = "Must be an integer ≥ 0";
  if (!isFiniteNum(v.bathrooms) || v.bathrooms < 0) e.bathrooms = "Must be ≥ 0";

  if (!Number.isInteger(v.yearBuilt) || v.yearBuilt < 1800 || v.yearBuilt > thisYear) {
    e.yearBuilt = `Enter a realistic year (1800–${thisYear})`;
  }

  if (!isFiniteNum(v.lotSize) || v.lotSize < 0) e.lotSize = "Must be ≥ 0";
  if (!isFiniteNum(v.distanceToCityCenter) || v.distanceToCityCenter < 0) e.distanceToCityCenter = "Must be ≥ 0";

  if (!Number.isInteger(v.schoolRating) || v.schoolRating < 0 || v.schoolRating > 10) {
    e.schoolRating = "Must be an integer 0–10";
  }

  return e;
}

export function hasErrors(e: FieldErrors) {
  return Object.keys(e).length > 0;
}
