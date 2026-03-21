import { Request, Response } from "express";
import { HttpError } from "../utils/httpError";
import {
  createBulkSubmissionsWithResults,
  createSubmissionWithResult,
  getSubmissionStats,
  getSubmissionById,
  listSubmissions
} from "../services/submissionService";

export async function uploadSubmission(req: Request, res: Response) {
  if (!req.user) {
    throw new HttpError(401, "Unauthorized");
  }
  if (!req.file) {
    throw new HttpError(400, "A PDF or DOCX file is required");
  }

  const created = await createSubmissionWithResult({
    file: req.file,
    uploadedById: req.user.id
  });

  res.status(201).json({
    submissionId: created.submission.id,
    similarityScore: created.result.similarityScore,
    colorIndicator: created.result.colorIndicator,
    riskLevel: created.result.riskLevel
  });
}

export async function uploadBulkSubmissions(req: Request, res: Response) {
  if (!req.user) {
    throw new HttpError(401, "Unauthorized");
  }

  const files = req.files as Express.Multer.File[] | undefined;
  if (!files || files.length === 0) {
    throw new HttpError(400, "At least one PDF or DOCX file is required");
  }

  const result = await createBulkSubmissionsWithResults({
    files,
    uploadedById: req.user.id
  });

  res.status(201).json(result);
}

export async function getSubmissions(req: Request, res: Response) {
  if (!req.user) {
    throw new HttpError(401, "Unauthorized");
  }

  const submissions = await listSubmissions(req.user);
  res.json({ submissions });
}

export async function getSubmissionStatsController(req: Request, res: Response) {
  if (!req.user) {
    throw new HttpError(401, "Unauthorized");
  }

  const stats = await getSubmissionStats(req.user);
  res.json({ stats });
}

export async function getSubmission(req: Request, res: Response) {
  if (!req.user) {
    throw new HttpError(401, "Unauthorized");
  }

  const submission = await getSubmissionById(req.params.id, req.user);
  res.json({ submission });
}
