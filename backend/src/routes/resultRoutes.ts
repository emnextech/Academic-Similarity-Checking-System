import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware";
import { asyncHandler } from "../utils/asyncHandler";
import { getResult } from "../controllers/resultController";

const router = Router();

router.get("/:submissionId", requireAuth, asyncHandler(getResult));

export default router;
