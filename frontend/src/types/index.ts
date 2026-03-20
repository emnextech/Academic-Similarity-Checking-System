export type UserRole = "LECTURER" | "ADMIN";

export type User = {
  id: string;
  email: string;
  role: UserRole;
};

export type SimilarityResult = {
  submissionId: string;
  similarityScore: number;
  colorIndicator: "grey" | "green" | "yellow" | "orange" | "red";
  riskLevel: string;
};

export type Submission = {
  id: string;
  originalFileName: string;
  fileType: string;
  fileSize: number;
  uploadedById: string;
  createdAt: string;
  result?: Omit<SimilarityResult, "submissionId">;
};

export type LoginResponse = {
  token: string;
  user: User;
};
