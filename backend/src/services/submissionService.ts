import { Prisma, ReviewStatus, UserRole } from "@prisma/client";
import { env } from "../config/env";
import { prisma } from "../config/prisma";
import { cleanText } from "./textCleaningService";
import { extractTextFromFile } from "./textExtractionService";
import { compareAgainstStoredSubmissions, type MatchedPassage } from "./similarityService";
import { mapScoreToRisk } from "./scoreMappingService";
import { HttpError } from "../utils/httpError";
import { queueExternalScanIfEnabled } from "./externalScanService";

type UploadInput = {
  file: Express.Multer.File;
  uploadedById: string;
};

type BulkUploadInput = {
  files: Express.Multer.File[];
  uploadedById: string;
};

type MarkPayload = {
  markScore?: number | null;
  markerComment?: string;
  reviewStatus?: ReviewStatus;
};

export async function createSubmissionWithResult({ file, uploadedById }: UploadInput) {
  const extractedText = await extractTextFromFile(file.path, file.mimetype);
  const cleanedText = cleanText(extractedText);

  if (!cleanedText) {
    throw new HttpError(400, "No usable text found in the uploaded document");
  }

  let scorePercentage = 0;
  let matchedSubmissionId: string | undefined;
  let matchedPassages: MatchedPassage[] = [];

  if (env.ENABLE_INTERNAL_SIMILARITY) {
    const existingSubmissions = await prisma.submission.findMany({
      select: { id: true, cleanedText: true, extractedText: true }
    });
    const compared = compareAgainstStoredSubmissions({ cleanedText, extractedText }, existingSubmissions);
    scorePercentage = compared.scorePercentage;
    matchedSubmissionId = compared.matchedSubmissionId;
    matchedPassages = compared.matchedPassages;
  }

  const mapped = mapScoreToRisk(scorePercentage);

  const created = await prisma.$transaction(async (tx) => {
    const submission = await tx.submission.create({
      data: {
        originalFileName: file.originalname,
        storedFileName: file.filename,
        filePath: file.path,
        fileType: file.mimetype,
        fileSize: file.size,
        extractedText,
        cleanedText,
        uploadedById
      }
    });

    const result = await tx.result.create({
      data: {
        submissionId: submission.id,
        matchedSubmissionId,
        similarityScore: mapped.similarityScore,
        colorIndicator: mapped.colorIndicator,
        riskLevel: mapped.riskLevel,
        reviewStatus: ReviewStatus.PENDING_REVIEW,
        matchedPassages: matchedPassages as Prisma.InputJsonValue
      }
    });

    return { submission, result };
  });

  await queueExternalScanIfEnabled({
    submissionId: created.submission.id,
    cleanedText,
    extractedText
  });

  return created;
}

export async function createBulkSubmissionsWithResults({ files, uploadedById }: BulkUploadInput) {
  const created: Array<{
    submissionId: string;
    fileName: string;
    similarityScore: number;
    colorIndicator: string;
    riskLevel: string;
  }> = [];
  const failed: Array<{ fileName: string; reason: string }> = [];

  for (const file of files) {
    try {
      const item = await createSubmissionWithResult({ file, uploadedById });
      created.push({
        submissionId: item.submission.id,
        fileName: item.submission.originalFileName,
        similarityScore: item.result.similarityScore,
        colorIndicator: item.result.colorIndicator,
        riskLevel: item.result.riskLevel
      });
    } catch (error) {
      failed.push({
        fileName: file.originalname,
        reason: error instanceof Error ? error.message : "Failed to process file"
      });
    }
  }

  return {
    total: files.length,
    created,
    failed
  };
}

export async function listSubmissions(user: { id: string; role: UserRole }) {
  return prisma.submission.findMany({
    where: user.role === UserRole.ADMIN ? undefined : { uploadedById: user.id },
    select: {
      id: true,
      originalFileName: true,
      fileType: true,
      fileSize: true,
      uploadedById: true,
      createdAt: true,
      result: {
        select: {
          similarityScore: true,
          colorIndicator: true,
          riskLevel: true,
          reviewStatus: true,
          markScore: true,
          markedAt: true
        }
      },
      externalScan: {
        select: {
          status: true,
          provider: true,
          errorMessage: true,
          completedAt: true
        }
      },
      uploadedBy: {
        select: { id: true, email: true, role: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });
}

export async function getSubmissionById(id: string, user: { id: string; role: UserRole }) {
  const submission = await prisma.submission.findUnique({
    where: { id },
    select: {
      id: true,
      originalFileName: true,
      fileType: true,
      fileSize: true,
      uploadedById: true,
      createdAt: true,
      updatedAt: true,
      result: true,
      externalScan: {
        select: {
          status: true,
          provider: true,
          errorMessage: true,
          completedAt: true
        }
      },
      uploadedBy: {
        select: { id: true, email: true, role: true }
      }
    }
  });

  if (!submission) {
    throw new HttpError(404, "Submission not found");
  }

  if (user.role !== UserRole.ADMIN && submission.uploadedById !== user.id) {
    throw new HttpError(403, "Access denied");
  }

  return submission;
}

export async function getSubmissionStats(user: { id: string; role: UserRole }) {
  const submissions = await prisma.submission.findMany({
    where: user.role === UserRole.ADMIN ? undefined : { uploadedById: user.id },
    select: {
      id: true,
      result: {
        select: {
          similarityScore: true,
          riskLevel: true,
          reviewStatus: true,
          markScore: true
        }
      }
    }
  });

  const totalSubmissions = submissions.length;
  const marked = submissions.filter((item) => item.result?.reviewStatus === ReviewStatus.MARKED);
  const pending = submissions.filter((item) => item.result?.reviewStatus === ReviewStatus.PENDING_REVIEW);
  const inReview = submissions.filter((item) => item.result?.reviewStatus === ReviewStatus.IN_REVIEW);

  const markValues = marked
    .map((item) => item.result?.markScore)
    .filter((value): value is number => typeof value === "number");

  const averageMark =
    markValues.length > 0 ? Number((markValues.reduce((sum, current) => sum + current, 0) / markValues.length).toFixed(2)) : null;

  const highRiskCount = submissions.filter((item) => item.result?.riskLevel === "High Similarity").length;
  const criticalRiskCount = submissions.filter((item) => item.result?.riskLevel === "Critical Similarity").length;

  return {
    totalSubmissions,
    markedCount: marked.length,
    pendingReviewCount: pending.length,
    inReviewCount: inReview.length,
    averageMark,
    highRiskCount,
    criticalRiskCount
  };
}

export async function getResultBySubmissionId(submissionId: string, user: { id: string; role: UserRole }) {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    select: { id: true, uploadedById: true }
  });

  if (!submission) {
    throw new HttpError(404, "Submission not found");
  }

  if (user.role !== UserRole.ADMIN && submission.uploadedById !== user.id) {
    throw new HttpError(403, "Access denied");
  }

  const result = await prisma.result.findUnique({
    where: { submissionId },
    select: {
      submissionId: true,
      similarityScore: true,
      colorIndicator: true,
      riskLevel: true,
      reviewStatus: true,
      markScore: true,
      markerComment: true,
      markedAt: true,
      matchedPassages: true,
      markedBy: {
        select: {
          id: true,
          email: true
        }
      },
      matchedSubmission: {
        select: {
          id: true,
          originalFileName: true,
          createdAt: true
        }
      },
      submission: {
        select: {
          externalScan: {
            select: {
              status: true,
              provider: true,
              errorMessage: true,
              completedAt: true,
              rawPayload: true,
              sourceMatches: {
                orderBy: [{ similarity: "desc" }, { matchedWords: "desc" }],
                take: 20,
                select: {
                  id: true,
                  sourceType: true,
                  title: true,
                  url: true,
                  matchedWords: true,
                  similarity: true,
                  snippet: true,
                  sourceSnippet: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!result) {
    throw new HttpError(404, "Result not found");
  }

  return result;
}

export async function markSubmissionResult(
  submissionId: string,
  user: { id: string; role: UserRole },
  payload: MarkPayload
) {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    select: {
      id: true,
      uploadedById: true,
      result: {
        select: { id: true }
      }
    }
  });

  if (!submission || !submission.result) {
    throw new HttpError(404, "Submission result not found");
  }

  if (user.role !== UserRole.ADMIN && submission.uploadedById !== user.id) {
    throw new HttpError(403, "Access denied");
  }

  const normalizedMark =
    typeof payload.markScore === "number"
      ? Number(Math.max(0, Math.min(10, payload.markScore)).toFixed(2))
      : payload.markScore === null
        ? null
        : undefined;

  const normalizedComment =
    typeof payload.markerComment === "string"
      ? payload.markerComment.trim().slice(0, 2000) || null
      : undefined;

  let reviewStatus = payload.reviewStatus;
  if (!reviewStatus) {
    if (typeof normalizedMark === "number") {
      reviewStatus = ReviewStatus.MARKED;
    } else if (normalizedComment) {
      reviewStatus = ReviewStatus.IN_REVIEW;
    }
  }

  if (reviewStatus === ReviewStatus.MARKED && typeof normalizedMark !== "number") {
    throw new HttpError(400, "A mark out of 10 is required when status is MARKED");
  }

  const updated = await prisma.result.update({
    where: { submissionId },
    data: {
      ...(normalizedMark !== undefined ? { markScore: normalizedMark } : {}),
      ...(normalizedComment !== undefined ? { markerComment: normalizedComment } : {}),
      ...(reviewStatus ? { reviewStatus } : {}),
      markedById: user.id,
      markedAt: new Date()
    },
    select: {
      submissionId: true,
      markScore: true,
      markerComment: true,
      reviewStatus: true,
      markedAt: true,
      markedBy: {
        select: {
          id: true,
          email: true
        }
      }
    }
  });

  return updated;
}

export async function triggerExternalRescan(submissionId: string, user: { id: string; role: UserRole }) {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    select: {
      id: true,
      uploadedById: true,
      cleanedText: true,
      extractedText: true
    }
  });

  if (!submission) {
    throw new HttpError(404, "Submission not found");
  }

  if (user.role !== UserRole.ADMIN && submission.uploadedById !== user.id) {
    throw new HttpError(403, "Access denied");
  }

  const queued = await queueExternalScanIfEnabled({
    submissionId: submission.id,
    cleanedText: submission.cleanedText,
    extractedText: submission.extractedText
  });

  if (!queued) {
    throw new HttpError(400, "External free-source scan is disabled in backend configuration");
  }

  return {
    submissionId: submission.id,
    status: queued.status
  };
}
