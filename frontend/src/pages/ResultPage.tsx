import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { Card } from "../components/ui/Card";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { getResultBySubmissionId, markResult, triggerResultRescan } from "../services/resultService";
import { ExternalSourceMatch, MatchedPassage, ReviewStatus, SimilarityResult } from "../types";
import { scoreColorClass } from "../utils/scoreColor";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function highlightTerms(snippet: string, terms: string[]) {
  const escapedSnippet = escapeHtml(snippet);
  const uniqueTerms = [...new Set(terms)].filter((term) => term.length >= 3);
  if (uniqueTerms.length === 0) return escapedSnippet;

  const pattern = uniqueTerms
    .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
  const regex = new RegExp(`\\b(${pattern})\\b`, "gi");

  return escapedSnippet.replace(
    regex,
    `<mark class="rounded bg-yellow-200/80 px-0.5 text-slate-900">$1</mark>`
  );
}

function reviewStatusClass(status: ReviewStatus) {
  switch (status) {
    case "MARKED":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "IN_REVIEW":
      return "bg-blue-100 text-blue-700 border-blue-200";
    default:
      return "bg-amber-100 text-amber-700 border-amber-200";
  }
}

function PassageCard({ passage }: { passage: MatchedPassage }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-900">Passage Match</p>
        <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
          {passage.overlapScore}% overlap
        </span>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Current Submission</p>
          <p
            className="text-sm leading-6 text-slate-800"
            dangerouslySetInnerHTML={{ __html: highlightTerms(passage.currentSnippet, passage.commonTerms) }}
          />
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Matched Submission</p>
          <p
            className="text-sm leading-6 text-slate-800"
            dangerouslySetInnerHTML={{ __html: highlightTerms(passage.matchedSnippet, passage.commonTerms) }}
          />
        </div>
      </div>
    </div>
  );
}

function externalStatusMeta(status: string) {
  switch (status) {
    case "COMPLETED":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "FAILED":
      return "bg-red-100 text-red-700 border-red-200";
    case "SUBMITTED":
      return "bg-blue-100 text-blue-700 border-blue-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function SourceMatchCard({ source }: { source: ExternalSourceMatch }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="font-semibold text-slate-900">{source.title || "External source match"}</p>
        <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
          {source.similarity ?? 0}% match
        </span>
      </div>
      {source.url ? (
        <a
          href={source.url}
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-block break-all text-xs text-brand-700 underline"
        >
          {source.url}
        </a>
      ) : null}
      <p className="mt-3 text-sm text-slate-700">{source.snippet || "No snippet provided by provider."}</p>
      {source.matchedWords ? <p className="mt-2 text-xs text-slate-500">Matched words: {source.matchedWords}</p> : null}
    </div>
  );
}

export function ResultPage() {
  const { submissionId = "" } = useParams();
  const [result, setResult] = useState<SimilarityResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRescanning, setIsRescanning] = useState(false);
  const [isSavingMark, setIsSavingMark] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markScore, setMarkScore] = useState<string>("");
  const [markerComment, setMarkerComment] = useState("");
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>("PENDING_REVIEW");

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

  useEffect(() => {
    if (!result) return;
    setMarkScore(typeof result.markScore === "number" ? String(result.markScore) : "");
    setMarkerComment(result.markerComment ?? "");
    setReviewStatus(result.reviewStatus ?? "PENDING_REVIEW");
  }, [result]);

  useEffect(() => {
    const status = result?.submission?.externalScan?.status;
    if (status !== "QUEUED" && status !== "SUBMITTED") {
      return;
    }

    const interval = setInterval(() => {
      void (async () => {
        try {
          const data = await getResultBySubmissionId(submissionId);
          setResult(data);
        } catch {
          // polling errors ignored silently
        }
      })();
    }, 8000);

    return () => clearInterval(interval);
  }, [result?.submission?.externalScan?.status, submissionId]);

  async function runRescan() {
    setIsRescanning(true);
    setError(null);
    try {
      await triggerResultRescan(submissionId);
      const refreshed = await getResultBySubmissionId(submissionId);
      setResult(refreshed);
    } catch {
      setError("Failed to trigger external re-scan.");
    } finally {
      setIsRescanning(false);
    }
  }

  async function saveMarking() {
    setIsSavingMark(true);
    setError(null);
    try {
      const numericMark = markScore.trim() === "" ? null : Number(markScore);
      await markResult(submissionId, {
        markScore: Number.isFinite(numericMark) ? numericMark : null,
        markerComment,
        reviewStatus
      });
      const refreshed = await getResultBySubmissionId(submissionId);
      setResult(refreshed);
    } catch {
      setError("Failed to save mark. Ensure mark is between 0 and 10.");
    } finally {
      setIsSavingMark(false);
    }
  }

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Lecturer Review</h2>
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
        <div className="space-y-4">
          <Card className="max-w-4xl">
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

            {result.matchedSubmission ? (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                Closest internal match: <span className="font-semibold">{result.matchedSubmission.originalFileName}</span>
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                Internal similarity comparison is disabled for this system.
              </div>
            )}
          </Card>

          <Card className="max-w-4xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Lecturer Marking (Out of 10)</h3>
                <p className="mt-1 text-sm text-slate-500">Save review status, comments, and final mark.</p>
              </div>
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${reviewStatusClass(reviewStatus)}`}>
                {reviewStatus.replace("_", " ")}
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Mark / 10</label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  step={0.01}
                  value={markScore}
                  onChange={(event) => setMarkScore(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  placeholder="e.g. 7.5"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Review Status</label>
                <select
                  value={reviewStatus}
                  onChange={(event) => setReviewStatus(event.target.value as ReviewStatus)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                >
                  <option value="PENDING_REVIEW">Pending Review</option>
                  <option value="IN_REVIEW">In Review</option>
                  <option value="MARKED">Marked</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => void saveMarking()}
                  disabled={isSavingMark}
                  className="w-full rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {isSavingMark ? "Saving..." : "Save Marking"}
                </button>
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-1 block text-sm font-medium text-slate-700">Marker Comment</label>
              <textarea
                rows={4}
                value={markerComment}
                onChange={(event) => setMarkerComment(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                placeholder="Add feedback for grading and moderation..."
              />
            </div>

            {result.markedBy ? (
              <p className="mt-3 text-xs text-slate-500">
                Last marked by {result.markedBy.email}
                {result.markedAt ? ` on ${new Date(result.markedAt).toLocaleString()}` : ""}
              </p>
            ) : null}
          </Card>

          <Card className="max-w-4xl">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-900">External Source Scan</h3>
              <p className="mt-1 text-sm text-slate-500">
                Free-source scholarly scan used for plagiarism assistance.
              </p>
            </div>

            {result.submission?.externalScan ? (
              <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm text-slate-700">Provider:</p>
                  <span className="text-sm font-semibold uppercase text-slate-900">
                    {result.submission.externalScan.provider}
                  </span>
                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${externalStatusMeta(result.submission.externalScan.status)}`}
                  >
                    {result.submission.externalScan.status}
                  </span>
                  <button
                    type="button"
                    onClick={() => void runRescan()}
                    disabled={isRescanning}
                    className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isRescanning ? "Re-scanning..." : "Re-run External Scan"}
                  </button>
                </div>
                {result.submission.externalScan.errorMessage ? (
                  <p className="mt-2 text-sm text-slate-600">{result.submission.externalScan.errorMessage}</p>
                ) : null}
                {result.submission.externalScan.rawPayload?.candidateCount !== undefined ? (
                  <p className="mt-2 text-xs text-slate-500">
                    Candidates analyzed: {result.submission.externalScan.rawPayload.candidateCount} | Strong matches:{" "}
                    {result.submission.externalScan.rawPayload.strongMatchCount ?? 0}
                  </p>
                ) : null}
              </div>
            ) : null}

            {result.submission?.externalScan?.sourceMatches &&
            result.submission.externalScan.sourceMatches.length > 0 ? (
              <div className="space-y-3">
                {result.submission.externalScan.sourceMatches.map((source) => (
                  <SourceMatchCard key={source.id} source={source} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                {result.submission?.externalScan?.status === "COMPLETED"
                  ? "Scan completed but no strong external scholarly matches were found."
                  : "No external source matches yet."}
              </p>
            )}
          </Card>

          <Card className="max-w-4xl">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Internal Match Passages</h3>
              <p className="mt-1 text-sm text-slate-500">
                Highlighted overlap passages from internal comparison (if enabled).
              </p>
            </div>

            {result.matchedPassages && result.matchedPassages.length > 0 ? (
              <div className="space-y-3">
                {result.matchedPassages.map((passage, index) => (
                  <PassageCard key={`${index}-${passage.overlapScore}`} passage={passage} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No internal overlap passages available.</p>
            )}
          </Card>
        </div>
      )}
    </AppShell>
  );
}
