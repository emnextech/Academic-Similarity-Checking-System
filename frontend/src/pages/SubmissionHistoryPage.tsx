import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { Card } from "../components/ui/Card";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { getSubmissions } from "../services/submissionService";
import { Submission } from "../types";
import { scoreColorClass } from "../utils/scoreColor";

export function SubmissionHistoryPage() {
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

  return (
    <AppShell>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-slate-900">Submission History</h2>
        <p className="mt-1 text-sm text-slate-500">Browse all uploaded assignments and their similarity risk status.</p>
      </div>

      <Card>
        {isLoading ? (
          <LoadingSpinner label="Loading history..." />
        ) : submissions.length === 0 ? (
          <p className="text-sm text-slate-500">No submissions available.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="pb-3">File</th>
                  <th className="pb-3">Submitted</th>
                  <th className="pb-3">Score</th>
                  <th className="pb-3">Risk Level</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission) => (
                  <tr key={submission.id} className="border-b border-slate-100 text-sm">
                    <td className="py-4 text-slate-900">{submission.originalFileName}</td>
                    <td className="py-4 text-slate-600">{new Date(submission.createdAt).toLocaleString()}</td>
                    <td className="py-4">
                      {submission.result ? (
                        <span className="font-semibold text-slate-900">{submission.result.similarityScore}%</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-4">
                      {submission.result ? (
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-semibold ${scoreColorClass(submission.result.colorIndicator)}`}
                        >
                          {submission.result.riskLevel}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-4 text-right">
                      <Link
                        to={`/result/${submission.id}`}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        View Result
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </AppShell>
  );
}
