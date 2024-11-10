import { Router } from "express";
import { Request, Response } from "express";
import { authenticateToken } from "../middleware/authJWT";
import supabase from "../database/db";
import {
  getAllFlashcards,
  getFlashcardsByTopicAndReviewDate,
  updateFlashcardReview,
  createFlashcardWithQuestion
} from "../controllers/flashcards";

const router = Router();

router.get(
  "/",
  authenticateToken,
  getAllFlashcards
);

router.get(
  "/:id/topics/:topicId/flashcards",
  authenticateToken,
  getFlashcardsByTopicAndReviewDate
);

router.post(
  "/:id/topics/:topicId/flashcards/:flashcardId",
  authenticateToken,
  updateFlashcardReview
);

router.post('/:id/topics/:topicId/flashcards',authenticateToken ,createFlashcardWithQuestion)
export default router;
