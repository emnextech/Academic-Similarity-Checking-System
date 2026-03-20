import { UserRole } from "@prisma/client";
import { prisma } from "../config/prisma";
import { cleanText } from "./textCleaningService";
import { extractTextFromFile } from "./textExtractionService";
import { compareAgainstStoredSubmissions } from "./similarityService";
import { mapScoreToRisk } from "./scoreMappingService";
import { HttpError } from "../utils/httpError";

type UploadInput = {
  file: Express.Multer.File;
  uploadedById: string;
};

export async function createSubmissionWithResult({ file, uploadedById }: UploadInput) {
  const extractedText = await extractTextFromFile(file.path, file.mimetype);
  const cleanedText = cleanText(extractedText);

  if (!cleanedText) {
    throw new HttpError(400, "No usable text found in the uploaded document");
  }

  const existingSubmissions = await prisma.submission.findMany({
    select: { id: true, cleanedText: true }
  });

  const { scorePercentage, matchedSubmissionId } = compareAgainstStoredSubmissions(
    cleanedText,
    existingSubmissions
  );

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
        riskLevel: mapped.riskLevel
      }
    });

    return { submission, result };
  });

  return created;
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
          riskLevel: true
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
      riskLevel: true
    }
  });

  if (!result) {
    throw new HttpError(404, "Result not found");
  }

  return result;
}
