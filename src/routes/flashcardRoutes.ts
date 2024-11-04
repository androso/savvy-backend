import { Router } from "express";
import { Request, Response } from "express";
import { authenticateToken } from "../middleware/authJWT";
import supabase from "../database/db";
import {
  createFlashCard,
  getFlashcardsByTopicAndReviewDate,
  updateFlashcardReview,
  createFlashcardWithQuestion
} from "../controllers/flashcards";

const router = Router();

router.get(
  "/",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user_id = req.user?.id;
      if (!user_id) {
        res.status(400).json({ error: "Unauthorized" });
      }
      const { data: courses, error: courseError } = await supabase
        .from("courses")
        .select("course_id")
        .eq("user_id", user_id);

      if (courseError) {
        res.status(500).json({ error: courseError.message });
        return;
      }

      if (!courses || courses.length === 0) {
        res.status(404).json({ error: "No courses found for this user" });
        return;
      }

      const courseIds = courses.map((course) => course.course_id);

      const { data: topics, error: topicsError } = await supabase
        .from("topics")
        .select("topic_id")
        .eq("course_id", courseIds);

      if (topicsError) {
        res.status(500).json({ error: topicsError.message });
        return;
      }

      if (!topics || topics.length === 0) {
        res.status(404).json({ message: "No topics found for the user." });
        return;
      }

      const topicIds = topics.map((topic) => topic.topic_id);
      const { data: flashcards, error: flashcardsError } = await supabase
        .from("flashcards")
        .select("*")
        .in("topic_id", topicIds);

      if (flashcardsError) {
        res.status(500).json({ error: flashcardsError.message });
        return;
      }

      res.status(200).json({ flashcards });
    } catch (error) {
      res.status(500).json({ error: "An unexpected error occurred." });
    }
  }
);


router.get(
  "/:id/topics/:topicId/flashcards",
  authenticateToken,
  getFlashcardsByTopicAndReviewDate
);

router.post(
  "/:id/topics/:topicId/flashcards/:fcId",
  authenticateToken,
  updateFlashcardReview
);

router.post('/:id/topics/:topicId/flashcards',authenticateToken ,createFlashcardWithQuestion)
export default router;
