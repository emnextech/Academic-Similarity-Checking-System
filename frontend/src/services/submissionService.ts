import { api } from "./api";
import { BulkUploadResponse, SimilarityResult, Submission, SubmissionStats } from "../types";

export async function uploadSubmission(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post<SimilarityResult>("/submissions/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });

  return response.data;
}

export async function uploadSubmissionsBulk(files: File[]) {
  const formData = new FormData();
  for (const file of files) {
    formData.append("files", file);
  }

  const response = await api.post<BulkUploadResponse>("/submissions/upload/bulk", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });

  return response.data;
}

export async function getSubmissions() {
  const response = await api.get<{ submissions: Submission[] }>("/submissions");
  return response.data.submissions;
}

export async function getSubmissionStats() {
  const response = await api.get<{ stats: SubmissionStats }>("/submissions/stats");
  return response.data.stats;
}

export async function getSubmissionById(id: string) {
  const response = await api.get<{ submission: Submission }>(`/submissions/${id}`);
  return response.data.submission;
}
