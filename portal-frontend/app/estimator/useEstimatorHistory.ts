// app/estimator/useEstimatorHistory.ts
"use client";

import { useEffect, useMemo, useState } from "react";

export type Features = {
  square_footage: number;
  bedrooms: number;
  bathrooms: number;
  year_built: number;
  lot_size: number;
  distance_to_city_center: number;
  school_rating: number;
};

export type HistoryEntry = {
  id: string;
  timestamp: string; // ISO string
  features: Features;
  prediction: number;
};

const HISTORY_STORAGE_KEY = "estimatorHistory";

export function useEstimatorHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);

  // Load history on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as HistoryEntry[];
        setHistory(parsed);
      }
    } catch (err) {
      console.warn("Failed to load history from localStorage", err);
    }
  }, []);

  // Save history whenever it changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch (err) {
      console.warn("Failed to save history to localStorage", err);
    }
  }, [history]);

  const addEntry = (features: Features, prediction: number) => {
    const entry: HistoryEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      features,
      prediction,
    };
    setHistory((prev) => [entry, ...prev]);
  };

  const clearHistory = () => {
    setHistory([]);
    setSelectedForCompare([]);
  };

  const toggleCompareSelection = (id: string) => {
    setSelectedForCompare((prev) => {
      if (prev.includes(id)) {
        // unselect
        return prev.filter((x) => x !== id);
      }
      if (prev.length >= 2) {
        // keep only the last selected + this new one
        return [prev[1], id];
      }
      return [...prev, id];
    });
  };

  const selectedEntries = useMemo(
    () => history.filter((h) => selectedForCompare.includes(h.id)),
    [history, selectedForCompare]
  );

  const chartData = useMemo(
    () =>
      history
        .slice()
        .reverse()
        .map((entry, idx) => ({
          index: idx + 1,
          square_footage: entry.features.square_footage,
          prediction: entry.prediction,
        })),
    [history]
  );

  return {
    history,
    addEntry,
    clearHistory,
    selectedForCompare,
    toggleCompareSelection,
    selectedEntries,
    chartData,
  };
}
