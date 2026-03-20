import { api } from "./api";
import { SimilarityResult } from "../types";

export async function getResultBySubmissionId(submissionId: string) {
  const response = await api.get<{ result: SimilarityResult }>(`/results/${submissionId}`);
  return response.data.result;
}
