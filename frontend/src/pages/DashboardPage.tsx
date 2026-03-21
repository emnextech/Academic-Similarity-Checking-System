import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { Card } from "../components/ui/Card";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { getSubmissionStats, getSubmissions } from "../services/submissionService";
import { Submission, SubmissionStats } from "../types";
import { scoreColorClass } from "../utils/scoreColor";

export function DashboardPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [stats, setStats] = useState<SubmissionStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [submissionData, statsData] = await Promise.all([getSubmissions(), getSubmissionStats()]);
        setSubmissions(submissionData);
        setStats(statsData);
      } finally {
        setIsLoading(false);
      }
    }
    void load();
  }, []);

  const summary = {
    total: stats?.totalSubmissions ?? submissions.length,
    pending: stats?.pendingReviewCount ?? 0,
    marked: stats?.markedCount ?? 0,
    averageMark: stats?.averageMark ?? null
  };

  return (
    <AppShell>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Dashboard</h2>
          <p className="mt-1 text-sm text-slate-500">Lecturer workspace for plagiarism review and marking out of 10.</p>
        </div>
        <Link
          to="/upload"
          className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          Upload Assignments
        </Link>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <Card>
          <p className="text-sm text-slate-500">Total Submissions</p>
          <p className="mt-3 text-3xl font-bold text-slate-900">{summary.total}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Pending Review</p>
          <p className="mt-3 text-3xl font-bold text-amber-600">{summary.pending}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Marked</p>
          <p className="mt-3 text-3xl font-bold text-emerald-600">{summary.marked}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Average Mark</p>
          <p className="mt-3 text-3xl font-bold text-slate-900">
            {summary.averageMark !== null ? `${summary.averageMark}/10` : "-"}
          </p>
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
            {submissions.slice(0, 8).map((submission) => (
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
                    {submission.result?.markScore !== null && submission.result?.markScore !== undefined ? (
                      <span className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                        Mark: {submission.result.markScore}/10
                      </span>
                    ) : (
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                        Pending Mark
                      </span>
                    )}
                    <Link
                      to={`/result/${submission.id}`}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Open
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
