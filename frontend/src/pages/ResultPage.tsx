import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { Card } from "../components/ui/Card";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { getResultBySubmissionId } from "../services/resultService";
import { SimilarityResult } from "../types";
import { scoreColorClass } from "../utils/scoreColor";

export function ResultPage() {
  const { submissionId = "" } = useParams();
  const [result, setResult] = useState<SimilarityResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getResultBySubmissionId(submissionId);
        setResult(data);
      } catch {
        setError("Could not load the result.");
      } finally {
        setIsLoading(false);
      }
    }
    void load();
  }, [submissionId]);

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Similarity Result</h2>
          <p className="mt-1 text-sm text-slate-500">Submission ID: {submissionId}</p>
        </div>
        <Link
          to="/history"
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Back to History
        </Link>
      </div>

      {isLoading ? (
        <Card>
          <LoadingSpinner label="Loading result..." />
        </Card>
      ) : error || !result ? (
        <Card>
          <p className="text-sm text-red-600">{error ?? "Result not found."}</p>
        </Card>
      ) : (
        <Card className="max-w-3xl">
          <div className="grid gap-5 md:grid-cols-3">
            <div className="rounded-2xl bg-brand-50 p-5">
              <p className="text-sm text-slate-600">Similarity Score</p>
              <p className="mt-2 text-5xl font-extrabold text-brand-700">{result.similarityScore}%</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-sm text-slate-600">Color Indicator</p>
              <span
                className={`mt-3 inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${scoreColorClass(result.colorIndicator)}`}
              >
                {result.colorIndicator.toUpperCase()}
              </span>
            </div>
            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-sm text-slate-600">Risk Level</p>
              <p className="mt-3 text-lg font-semibold text-slate-900">{result.riskLevel}</p>
            </div>
          </div>
        </Card>
      )}
    </AppShell>
  );
}
