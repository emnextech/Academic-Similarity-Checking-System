import { Request, Response } from "express";
import { HttpError } from "../utils/httpError";
import { getResultBySubmissionId } from "../services/submissionService";

export async function getResult(req: Request, res: Response) {
  if (!req.user) {
    throw new HttpError(401, "Unauthorized");
  }

  const result = await getResultBySubmissionId(req.params.submissionId, req.user);
  res.json({ result });
}
