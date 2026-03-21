import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware";
import { uploadMiddleware } from "../middleware/uploadMiddleware";
import { asyncHandler } from "../utils/asyncHandler";
import {
  getSubmissionStatsController,
  getSubmission,
  getSubmissions,
  uploadBulkSubmissions,
  uploadSubmission
} from "../controllers/submissionController";

const router = Router();

router.post("/upload", requireAuth, uploadMiddleware.single("file"), asyncHandler(uploadSubmission));
router.post(
  "/upload/bulk",
  requireAuth,
  uploadMiddleware.array("files", 100),
  asyncHandler(uploadBulkSubmissions)
);
router.get("/stats", requireAuth, asyncHandler(getSubmissionStatsController));
router.get("/", requireAuth, asyncHandler(getSubmissions));
router.get("/:id", requireAuth, asyncHandler(getSubmission));

export default router;
