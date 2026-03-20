import { api } from "./api";
import { SimilarityResult, Submission } from "../types";

export async function uploadSubmission(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post<SimilarityResult>("/submissions/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });

  return response.data;
}

export async function getSubmissions() {
  const response = await api.get<{ submissions: Submission[] }>("/submissions");
  return response.data.submissions;
}

export async function getSubmissionById(id: string) {
  const response = await api.get<{ submission: Submission }>(`/submissions/${id}`);
  return response.data.submission;
}
