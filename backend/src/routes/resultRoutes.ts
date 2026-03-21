import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware";
import { asyncHandler } from "../utils/asyncHandler";
import { getResult, markResult, rescanResult } from "../controllers/resultController";

const router = Router();

router.get("/:submissionId", requireAuth, asyncHandler(getResult));
router.post("/:submissionId/rescan", requireAuth, asyncHandler(rescanResult));
router.patch("/:submissionId/mark", requireAuth, asyncHandler(markResult));

export default router;
