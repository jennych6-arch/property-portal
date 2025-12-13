// app/estimator/page.tsx
import EstimatorClient from "./EstimatorClient";

type ModelInfo = {
  features: string[];
};

const ML_MODEL_INFO_URL =
  process.env.ML_MODEL_INFO_URL || "http://localhost:8000/model-info";

export default async function EstimatorPage() {
  let modelInfo: ModelInfo | null = null;

  try {
    const res = await fetch(ML_MODEL_INFO_URL, { cache: "no-store" });

    if (res.ok) {
      const data = await res.json();
      modelInfo = { features: data.features ?? [] };
    } else {
      console.error("Failed to fetch model info:", res.status);
    }
  } catch (err) {
    console.error("Error fetching model info:", err);
  }

  return <EstimatorClient modelInfo={modelInfo} />;
}
