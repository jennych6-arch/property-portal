// app/estimator/EstimatorClient.tsx
"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import {
  useEstimatorHistory,
  Features,
} from "./useEstimatorHistory";

type ModelInfo = {
  features: string[];
};

type EstimatorClientProps = {
  modelInfo: ModelInfo | null;
};

// Estimator API base URL (Task 2 backend, NOT the ML container)
const ESTIMATOR_API_BASE =
  process.env.NEXT_PUBLIC_ESTIMATOR_API_URL || "http://localhost:9000";

export default function EstimatorClient({ modelInfo }: EstimatorClientProps) {
  const [features, setFeatures] = useState<Features>({
    square_footage: 1500,
    bedrooms: 3,
    bathrooms: 2,
    year_built: 2000,
    lot_size: 6000,
    distance_to_city_center: 5,
    school_rating: 7,
  });

  const [prediction, setPrediction] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const {
    history,
    addEntry,
    clearHistory,
    selectedForCompare,
    toggleCompareSelection,
    selectedEntries,
    chartData,
  } = useEstimatorHistory();

  // -----------------------------
  // Client-side validation
  // -----------------------------
  const validateFeatures = (f: Features): string[] => {
    const errors: string[] = [];

    const positiveFields: (keyof Features)[] = [
      "square_footage",
      "bedrooms",
      "bathrooms",
      "year_built",
      "lot_size",
      "distance_to_city_center",
      "school_rating",
    ];

    positiveFields.forEach((field) => {
      const value = f[field];
      if (Number.isNaN(value)) {
        errors.push(`"${field.replace(/_/g, " ")}" is required.`);
      } else if (value <= 0 && field !== "school_rating") {
        errors.push(
          `"${field.replace(
            /_/g,
            " "
          )}" must be greater than 0. (You entered ${value})`
        );
      }
    });

    if (f.square_footage < 100 || f.square_footage > 10000) {
      errors.push(
        `"square footage" looks out of range (100 - 10,000). You entered ${f.square_footage}.`
      );
    }
    if (f.bedrooms > 10) {
      errors.push(
        `"bedrooms" looks too high (max 10 for this demo). You entered ${f.bedrooms}.`
      );
    }
    if (f.bathrooms > 10) {
      errors.push(
        `"bathrooms" looks too high (max 10 for this demo). You entered ${f.bathrooms}.`
      );
    }
    if (f.year_built < 1900 || f.year_built > new Date().getFullYear()) {
      errors.push(
        `"year built" should be between 1900 and ${new Date().getFullYear()}. You entered ${f.year_built}.`
      );
    }
    if (f.school_rating < 1 || f.school_rating > 10) {
      errors.push(
        `"school rating" should be between 1 and 10. You entered ${f.school_rating}.`
      );
    }

    return errors;
  };

  const handleChange = (field: keyof Features, value: string) => {
    const num = value === "" ? NaN : Number(value);
    setFeatures((prev) => ({
      ...prev,
      [field]: num,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError(null);
    setPrediction(null);
    setValidationErrors([]);

    // 1) Client-side validation
    const errors = validateFeatures(features);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setLoading(true);
    try {
      // Call Project 2 Estimator API, which proxies to Task 1 ML container
      const res = await fetch(`${ESTIMATOR_API_BASE}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ features }),
      });

      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        throw new Error(detail.detail || "Prediction failed");
      }

      const data = await res.json();

      const value: number | undefined =
        typeof data.prediction === "number"
          ? data.prediction
          : Array.isArray(data.predictions)
          ? data.predictions[0]
          : undefined;

      if (typeof value !== "number") {
        throw new Error("Invalid prediction response from estimator API.");
      }

      setPrediction(value);
      addEntry(features, value);
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Property Value Estimator</h1>
      <p className="text-sm text-slate-600">
        Enter property details below to get an estimated price from the trained
        regression model. The form is validated on the client, and every
        successful prediction is added to your local history.
      </p>

      {modelInfo && modelInfo.features?.length > 0 && (
        <p className="text-xs text-slate-500">
          Model features: {modelInfo.features.join(", ")}
        </p>
      )}

      {/* Validation errors */}
      {validationErrors.length > 0 && (
        <div
          className="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800"
          aria-live="polite"
        >
          <div className="font-medium mb-1">Please fix the following:</div>
          <ul className="list-disc pl-5 space-y-0.5">
            {validationErrors.map((msg, idx) => (
              <li key={idx}>{msg}</li>
            ))}
          </ul>
        </div>
      )}

      {/* API error */}
      {error && (
        <div
          className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700"
          aria-live="polite"
        >
          Error calling estimator API: {error}
        </div>
      )}

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="grid gap-3 rounded border bg-white p-4 md:grid-cols-2"
      >
        {(
          [
            "square_footage",
            "bedrooms",
            "bathrooms",
            "year_built",
            "lot_size",
            "distance_to_city_center",
            "school_rating",
          ] as (keyof Features)[]
        ).map((field) => (
          <label key={field} className="flex flex-col text-sm gap-1">
            <span className="capitalize">
              {field.replace(/_/g, " ")}
              <span className="text-red-500"> *</span>
            </span>
            <input
              type="number"
              step={field === "bathrooms" ? "0.5" : "1"}
              value={Number.isNaN(features[field]) ? "" : features[field]}
              onChange={(e) => handleChange(field, e.target.value)}
              className="rounded border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <span className="text-xs text-slate-500">
              {field === "square_footage" &&
                "Total interior area in square feet."}
              {field === "bedrooms" && "Number of bedrooms."}
              {field === "bathrooms" &&
                "Number of bathrooms (e.g. 1.5, 2)."}
              {field === "year_built" && "Year the property was built."}
              {field === "lot_size" && "Lot size in square feet."}
              {field === "distance_to_city_center" &&
                "Distance to city center (e.g. km or miles)."}
              {field === "school_rating" &&
                "School quality rating from 1 to 10."}
            </span>
          </label>
        ))}

        <div className="md:col-span-2 flex items-center gap-3 mt-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Predicting..." : "Predict Price"}
          </button>
          {prediction !== null && (
            <span className="text-sm text-slate-700" aria-live="polite">
              Latest prediction:{" "}
              <span className="font-semibold">
                ${prediction.toFixed(2)}
              </span>
            </span>
          )}
        </div>
      </form>

      {/* History + comparison + chart layout */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800">
            Prediction History
          </h2>
          {history.length > 0 && (
            <button
              type="button"
              onClick={clearHistory}
              className="text-xs text-slate-500 hover:underline"
            >
              Clear history
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <p className="text-sm text-slate-500">
            No predictions yet. Submit the form above to see a history of
            results, enable comparison, and populate the chart.
          </p>
        ) : (
          <>
            {/* History table with selection */}
            <div className="overflow-x-auto rounded border bg-white">
              <table className="min-w-full border-collapse text-xs">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="border-b px-2 py-2 text-left">Compare</th>
                    <th className="border-b px-2 py-2 text-left">Time</th>
                    <th className="border-b px-2 py-2 text-left">Sq Ft</th>
                    <th className="border-b px-2 py-2 text-left">Bed</th>
                    <th className="border-b px-2 py-2 text-left">Bath</th>
                    <th className="border-b px-2 py-2 text-left">Year</th>
                    <th className="border-b px-2 py-2 text-left">Lot</th>
                    <th className="border-b px-2 py-2 text-left">Dist</th>
                    <th className="border-b px-2 py-2 text-left">School</th>
                    <th className="border-b px-2 py-2 text-left">
                      Predicted Price
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((entry) => (
                    <tr key={entry.id} className="odd:bg-white even:bg-slate-50">
                      <td className="border-b px-2 py-1">
                        <input
                          type="checkbox"
                          checked={selectedForCompare.includes(entry.id)}
                          onChange={() => toggleCompareSelection(entry.id)}
                        />
                      </td>
                      <td className="border-b px-2 py-1">
                        {formatTimestamp(entry.timestamp)}
                      </td>
                      <td className="border-b px-2 py-1">
                        {entry.features.square_footage}
                      </td>
                      <td className="border-b px-2 py-1">
                        {entry.features.bedrooms}
                      </td>
                      <td className="border-b px-2 py-1">
                        {entry.features.bathrooms}
                      </td>
                      <td className="border-b px-2 py-1">
                        {entry.features.year_built}
                      </td>
                      <td className="border-b px-2 py-1">
                        {entry.features.lot_size}
                      </td>
                      <td className="border-b px-2 py-1">
                        {entry.features.distance_to_city_center}
                      </td>
                      <td className="border-b px-2 py-1">
                        {entry.features.school_rating}
                      </td>
                      <td className="border-b px-2 py-1 font-semibold">
                        ${entry.prediction.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Comparison + chart */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded border bg-white p-3 text-xs">
                <h3 className="mb-2 text-sm font-semibold">
                  Scenario Comparison
                </h3>
                {selectedEntries.length !== 2 ? (
                  <p className="text-slate-500">
                    Select <span className="font-semibold">exactly two</span>{" "}
                    rows above using the checkboxes to compare scenarios side by
                    side.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse">
                      <thead className="bg-slate-50 text-slate-600">
                        <tr>
                          <th className="border-b px-2 py-1 text-left"></th>
                          <th className="border-b px-2 py-1 text-left">
                            Scenario A
                          </th>
                          <th className="border-b px-2 py-1 text-left">
                            Scenario B
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border-b px-2 py-1">Time</td>
                          <td className="border-b px-2 py-1">
                            {formatTimestamp(selectedEntries[0].timestamp)}
                          </td>
                          <td className="border-b px-2 py-1">
                            {formatTimestamp(selectedEntries[1].timestamp)}
                          </td>
                        </tr>
                        <tr>
                          <td className="border-b px-2 py-1">Sq Ft</td>
                          <td className="border-b px-2 py-1">
                            {selectedEntries[0].features.square_footage}
                          </td>
                          <td className="border-b px-2 py-1">
                            {selectedEntries[1].features.square_footage}
                          </td>
                        </tr>
                        <tr>
                          <td className="border-b px-2 py-1">Bedrooms</td>
                          <td className="border-b px-2 py-1">
                            {selectedEntries[0].features.bedrooms}
                          </td>
                          <td className="border-b px-2 py-1">
                            {selectedEntries[1].features.bedrooms}
                          </td>
                        </tr>
                        <tr>
                          <td className="border-b px-2 py-1">Bathrooms</td>
                          <td className="border-b px-2 py-1">
                            {selectedEntries[0].features.bathrooms}
                          </td>
                          <td className="border-b px-2 py-1">
                            {selectedEntries[1].features.bathrooms}
                          </td>
                        </tr>
                        <tr>
                          <td className="border-b px-2 py-1">Year built</td>
                          <td className="border-b px-2 py-1">
                            {selectedEntries[0].features.year_built}
                          </td>
                          <td className="border-b px-2 py-1">
                            {selectedEntries[1].features.year_built}
                          </td>
                        </tr>
                        <tr>
                          <td className="border-b px-2 py-1">Lot size</td>
                          <td className="border-b px-2 py-1">
                            {selectedEntries[0].features.lot_size}
                          </td>
                          <td className="border-b px-2 py-1">
                            {selectedEntries[1].features.lot_size}
                          </td>
                        </tr>
                        <tr>
                          <td className="border-b px-2 py-1">Distance</td>
                          <td className="border-b px-2 py-1">
                            {
                              selectedEntries[0].features
                                .distance_to_city_center
                            }
                          </td>
                          <td className="border-b px-2 py-1">
                            {
                              selectedEntries[1].features
                                .distance_to_city_center
                            }
                          </td>
                        </tr>
                        <tr>
                          <td className="border-b px-2 py-1">School rating</td>
                          <td className="border-b px-2 py-1">
                            {selectedEntries[0].features.school_rating}
                          </td>
                          <td className="border-b px-2 py-1">
                            {selectedEntries[1].features.school_rating}
                          </td>
                        </tr>
                        <tr>
                          <td className="border-b px-2 py-1">Predicted price</td>
                          <td className="border-b px-2 py-1 font-semibold">
                            ${selectedEntries[0].prediction.toFixed(2)}
                          </td>
                          <td className="border-b px-2 py-1 font-semibold">
                            ${selectedEntries[1].prediction.toFixed(2)}
                          </td>
                        </tr>
                        <tr>
                          <td className="border-b px-2 py-1">Difference</td>
                          <td className="border-b px-2 py-1" />
                          <td className="border-b px-2 py-1 font-semibold">
                            $
                            {(
                              selectedEntries[1].prediction -
                              selectedEntries[0].prediction
                            ).toFixed(2)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Chart */}
              <div className="rounded border bg-white p-3 text-xs">
                <h3 className="mb-2 text-sm font-semibold">
                  Price vs. Square Footage
                </h3>
                {chartData.length < 2 ? (
                  <p className="text-slate-500">
                    Make a few predictions with different square footage values
                    to populate this chart.
                  </p>
                ) : (
                  <div className="h-52 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="square_footage"
                          label={{
                            value: "Square footage",
                            position: "insideBottom",
                            offset: -2,
                          }}
                        />
                        <YAxis
                          tickFormatter={(v) =>
                            v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`
                          }
                        />
                        <Tooltip
                          formatter={(value: any, name: any) =>
                            name === "prediction"
                              ? [`$${(value as number).toFixed(2)}`, "Price"]
                              : [value, name]
                          }
                          labelFormatter={(label) =>
                            `Sq Ft: ${label as number}`
                          }
                        />
                        <Line
                          type="monotone"
                          dataKey="prediction"
                          stroke="#2563eb"
                          dot={{ r: 3 }}
                          activeDot={{ r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
