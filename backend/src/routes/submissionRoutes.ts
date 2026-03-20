import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware";
import { uploadMiddleware } from "../middleware/uploadMiddleware";
import { asyncHandler } from "../utils/asyncHandler";
import {
  getSubmission,
  getSubmissions,
  uploadSubmission
} from "../controllers/submissionController";

const router = Router();

router.post("/upload", requireAuth, uploadMiddleware.single("file"), asyncHandler(uploadSubmission));
router.get("/", requireAuth, asyncHandler(getSubmissions));
router.get("/:id", requireAuth, asyncHandler(getSubmission));

export default router;
