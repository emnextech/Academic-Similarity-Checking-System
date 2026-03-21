import { Request, Response } from "express";
import { ReviewStatus } from "@prisma/client";
import { z } from "zod";
import { HttpError } from "../utils/httpError";
import {
  getResultBySubmissionId,
  markSubmissionResult,
  triggerExternalRescan
} from "../services/submissionService";

const MarkSchema = z.object({
  markScore: z.number().min(0).max(10).optional().nullable(),
  markerComment: z.string().max(2000).optional(),
  reviewStatus: z.nativeEnum(ReviewStatus).optional()
});

export async function getResult(req: Request, res: Response) {
  if (!req.user) {
    throw new HttpError(401, "Unauthorized");
  }

  const result = await getResultBySubmissionId(req.params.submissionId, req.user);
  res.json({ result });
}

export async function rescanResult(req: Request, res: Response) {
  if (!req.user) {
    throw new HttpError(401, "Unauthorized");
  }

  const queued = await triggerExternalRescan(req.params.submissionId, req.user);
  res.status(202).json({ queued });
}

export async function markResult(req: Request, res: Response) {
  if (!req.user) {
    throw new HttpError(401, "Unauthorized");
  }

  const parsed = MarkSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, "Invalid marking payload");
  }

  const marked = await markSubmissionResult(req.params.submissionId, req.user, parsed.data);
  res.json({ marked });
}
