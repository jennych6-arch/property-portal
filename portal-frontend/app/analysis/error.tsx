"use client";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AnalysisError({ error, reset }: ErrorProps) {
  return (
    <div className="space-y-3 rounded border border-red-300 bg-red-50 p-4 text-sm text-red-800">
      <div className="font-semibold">Something went wrong in the analysis dashboard.</div>
      <div className="text-xs break-all">{error.message}</div>
      <button
        type="button"
        onClick={reset}
        className="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700"
      >
        Retry
      </button>
    </div>
  );
}
