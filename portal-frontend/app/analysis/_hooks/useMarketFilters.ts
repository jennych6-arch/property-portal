"use client";

import { useRouter } from "next/navigation";
import { MarketFilter } from "../_lib/types";
import { toQuery } from "../_lib/query";

export function useMarketFilters(initial: MarketFilter) {
  const router = useRouter();
  let filter = { ...initial };

  function set<K extends keyof MarketFilter>(key: K, value: string) {
    filter = { ...filter, [key]: value };
    return filter;
  }

  function apply(next: MarketFilter) {
    router.push(`/analysis${toQuery(next)}`);
  }

  function reset() {
    router.push("/analysis");
  }

  return { filter, set, apply, reset };
}
