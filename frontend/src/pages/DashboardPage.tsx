import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { Card } from "../components/ui/Card";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { getSubmissions } from "../services/submissionService";
import { Submission } from "../types";
import { scoreColorClass } from "../utils/scoreColor";

export function DashboardPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getSubmissions();
        setSubmissions(data);
      } finally {
        setIsLoading(false);
      }
    }
    void load();
  }, []);

  const summary = {
    total: submissions.length,
    critical: submissions.filter((item) => item.result?.riskLevel === "Critical Similarity").length,
    high: submissions.filter((item) => item.result?.riskLevel === "High Similarity").length
  };

  return (
    <AppShell>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Dashboard</h2>
          <p className="mt-1 text-sm text-slate-500">Track assignment similarity outcomes across submissions.</p>
        </div>
        <Link
          to="/upload"
          className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          Upload Assignment
        </Link>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm text-slate-500">Total Submissions</p>
          <p className="mt-3 text-3xl font-bold text-slate-900">{summary.total}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">High Similarity</p>
          <p className="mt-3 text-3xl font-bold text-orange-600">{summary.high}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Critical Similarity</p>
          <p className="mt-3 text-3xl font-bold text-red-600">{summary.critical}</p>
        </Card>
      </section>

      <Card className="mt-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Recent Submissions</h3>
          <Link to="/history" className="text-sm font-medium text-brand-600 hover:text-brand-700">
            View all
          </Link>
        </div>

        {isLoading ? (
          <LoadingSpinner label="Loading submissions..." />
        ) : submissions.length === 0 ? (
          <p className="text-sm text-slate-500">No submissions uploaded yet.</p>
        ) : (
          <div className="space-y-3">
            {submissions.slice(0, 6).map((submission) => (
              <div key={submission.id} className="rounded-xl border border-slate-200 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">{submission.originalFileName}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(submission.createdAt).toLocaleString()} • {Math.round(submission.fileSize / 1024)} KB
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {submission.result ? (
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${scoreColorClass(submission.result.colorIndicator)}`}
                      >
                        {submission.result.similarityScore}% • {submission.result.riskLevel}
                      </span>
                    ) : null}
                    <Link
                      to={`/result/${submission.id}`}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Open Result
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </AppShell>
  );
}
