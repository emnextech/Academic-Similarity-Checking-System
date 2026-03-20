import { Request, Response } from "express";
import { HttpError } from "../utils/httpError";
import {
  createSubmissionWithResult,
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

export async function getSubmissions(req: Request, res: Response) {
  if (!req.user) {
    throw new HttpError(401, "Unauthorized");
  }

  const submissions = await listSubmissions(req.user);
  res.json({ submissions });
}

export async function getSubmission(req: Request, res: Response) {
  if (!req.user) {
    throw new HttpError(401, "Unauthorized");
  }

  const submission = await getSubmissionById(req.params.id, req.user);
  res.json({ submission });
}
