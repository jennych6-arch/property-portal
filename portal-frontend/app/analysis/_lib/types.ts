export type MarketSummary = {
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  medianPrice: number;
  totalCount: number;
};

export type PropertyRecord = {
  price: number;
  squareFootage: number;
  bedrooms: number;
  bathrooms: number;
  yearBuilt: number;
  lotSize: number;
  distanceToCityCenter: number;
  schoolRating: number;
};

export type GroupedStatistic = {
  label: string;         // e.g. "1", "2", "3"
  count: number;         // number of properties in the group
  averagePrice: number;  // average price for the group
};

export type MarketFilter = {
  minPrice?: string;
  maxPrice?: string;
  minBedrooms?: string;
  maxBedrooms?: string;
  minSchoolRating?: string;
  maxSchoolRating?: string;
};

export type WhatIfRequest = {
  squareFootage: number;
  bedrooms: number;
  bathrooms: number;
  yearBuilt: number;
  lotSize: number;
  distanceToCityCenter: number;
  schoolRating: number;
};

export type WhatIfResponse = {
  predictedPrice: number;
  marketAverage: number;
  differenceFromAverage: number;
};
