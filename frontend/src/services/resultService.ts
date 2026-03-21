import { api } from "./api";
import { ReviewStatus, SimilarityResult } from "../types";

export async function getResultBySubmissionId(submissionId: string) {
  const response = await api.get<{ result: SimilarityResult }>(`/results/${submissionId}`);
  return response.data.result;
}

export async function triggerResultRescan(submissionId: string) {
  const response = await api.post<{ queued: { submissionId: string; status: string } }>(
    `/results/${submissionId}/rescan`
  );
  return response.data.queued;
}

export async function markResult(
  submissionId: string,
  payload: {
    markScore?: number | null;
    markerComment?: string;
    reviewStatus?: ReviewStatus;
  }
) {
  const response = await api.patch<{ marked: unknown }>(`/results/${submissionId}/mark`, payload);
  return response.data.marked;
}
