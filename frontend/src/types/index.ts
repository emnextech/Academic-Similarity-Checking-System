export type UserRole = "LECTURER" | "ADMIN";
export type ReviewStatus = "PENDING_REVIEW" | "IN_REVIEW" | "MARKED";

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
  reviewStatus?: ReviewStatus;
  markScore?: number | null;
  markerComment?: string | null;
  markedAt?: string | null;
  markedBy?: {
    id: string;
    email: string;
  } | null;
  matchedSubmission?: {
    id: string;
    originalFileName: string;
    createdAt: string;
  } | null;
  matchedPassages?: MatchedPassage[];
  submission?: {
    externalScan?: ExternalScanSummary | null;
  };
};

export type MatchedPassage = {
  currentSnippet: string;
  matchedSnippet: string;
  overlapScore: number;
  commonTerms: string[];
};

export type ExternalScanSummary = {
  status: "QUEUED" | "SUBMITTED" | "COMPLETED" | "FAILED";
  provider: string;
  errorMessage?: string | null;
  completedAt?: string | null;
  rawPayload?: {
    query?: string;
    candidateCount?: number;
    strongMatchCount?: number;
  } | null;
  sourceMatches?: ExternalSourceMatch[];
};

export type ExternalSourceMatch = {
  id: string;
  sourceType?: string | null;
  title?: string | null;
  url?: string | null;
  matchedWords?: number | null;
  similarity?: number | null;
  snippet?: string | null;
  sourceSnippet?: string | null;
};

export type Submission = {
  id: string;
  originalFileName: string;
  fileType: string;
  fileSize: number;
  uploadedById: string;
  createdAt: string;
  result?: {
    similarityScore: number;
    colorIndicator: "grey" | "green" | "yellow" | "orange" | "red";
    riskLevel: string;
    reviewStatus: ReviewStatus;
    markScore?: number | null;
    markedAt?: string | null;
  };
  externalScan?: ExternalScanSummary;
};

export type LoginResponse = {
  token: string;
  user: User;
};

export type SubmissionStats = {
  totalSubmissions: number;
  markedCount: number;
  pendingReviewCount: number;
  inReviewCount: number;
  averageMark: number | null;
  highRiskCount: number;
  criticalRiskCount: number;
};

export type BulkUploadResponse = {
  total: number;
  created: Array<{
    submissionId: string;
    fileName: string;
    similarityScore: number;
    colorIndicator: string;
    riskLevel: string;
  }>;
  failed: Array<{
    fileName: string;
    reason: string;
  }>;
};
