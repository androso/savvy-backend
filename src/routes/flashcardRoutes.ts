import { Router } from "express";
import { authenticateToken } from "../middleware/authJWT";

import {
  getFlashcardsByTopicAndReviewDate,
  updateFlashcardReview,
  createFlashcardWithQuestion
} from "../controllers/flashcards";

/**
 * @swagger
 * components:
 *   schemas:
 *     Flashcard:
 *       type: object
 *       properties:
 *         flashcard_id:
 *           type: string
 *           format: uuid
 *           example: "3bb72268-7658-408a-a3b4-a2205d6c8821"
 *         topic_id:
 *           type: string
 *           format: uuid
 *           example: "76d95c10-b643-41b7-aecd-ce6cc5c188dd"
 *         created_at:
 *           type: string
 *           format: date-time
 *           example: "2024-11-07T23:40:15.762373"
 *         next_review:
 *           type: string
 *           format: date-time
 *           example: "2024-11-10T19:54:32.016"
 *         last_review:
 *           type: string
 *           format: date-time
 *           example: "2024-11-10T19:49:32.022"
 *         flashcard_content_id:
 *           type: string
 *           format: uuid
 *           example: "5151c0e8-c9ca-474d-b7d5-93cf31d9f24c"
 *         flashcard_content:
 *           type: object
 *           properties:
 *             options:
 *               type: array
 *               items:
 *                 type: string
 *               example: ["Paris", "London", "Berlin", "Madrid"]
 *             question:
 *               type: string
 *               example: "What is the capital of France?"
 *             correct_option:
 *               type: string
 *               example: "Paris"
 */


const router = Router();

/**
 * @swagger
 * /:id/topics/:topicId/flashcards:
 *   get:
 *     summary: Get flashcards by topic and review date
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Flashcards
 *     parameters:
 *       - in: path
 *         name: topicId
 *         required: true
 *         schema:
 *           type: string
 *         description: The topic ID
 *     responses:
 *       200:
 *         description: A list of flashcards
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Flashcard'
 *       404:
 *         description: No flashcards found for this topic
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: No flashcards found for this topic
 *       500:
 *         description: Error fetching flashcards
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Error fetching flashcards
 */
router.get(
  "/:id/topics/:topicId/flashcards",
  authenticateToken,
  getFlashcardsByTopicAndReviewDate
);

/**
 * @swagger
 * /:id/topics/:topicId/flashcards/:flashcardId:
 *   post:
 *     summary: Update flashcard review
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Flashcards
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               flashcardId:
 *                 type: string
 *                 example: "3bb72268-7658-408a-a3b4-a2205d6c8821"
 *               rate:
 *                 type: string
 *                 example: "Again"
 *     responses:
 *       200:
 *         description: Flashcard review updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Flashcard review updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Flashcard'
 *       404:
 *         description: Flashcard not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Flashcard not found
 *                 error:
 *                   type: string
 *       500:
 *         description: Error updating flashcard review
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Error updating flashcard review
 *                 error:
 *                   type: string
 */

router.post(
  "/:id/topics/:topicId/flashcards/:flashcardId",
  authenticateToken,
  updateFlashcardReview
);
/**
 * @swagger
 * /:id/topics/:topicId/flashcards:
 *   post:
 *     summary: Create a new flashcard with a question
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Flashcards
 *     parameters:
 *       - in: path
 *         name: topicId
 *         required: true
 *         schema:
 *           type: string
 *         description: The topic ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               question:
 *                 type: string
 *                 example: "What is the capital of France?"
 *               options:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Paris", "London", "Berlin", "Madrid"]
 *               correct_option:
 *                 type: string
 *                 example: "Paris"
 *     responses:
 *       201:
 *         description: Flashcard created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Flash card created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Flashcard'
 *                 quizQuestion:
 *                   type: object
 *                   properties:
 *                     question:
 *                       type: string
 *                     options:
 *                       type: array
 *                       items:
 *                         type: string
 *                     correct_option:
 *                       type: string
 *       500:
 *         description: Error creating flashcard
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Error creating flashcard
 */
router.post('/:id/topics/:topicId/flashcards',authenticateToken ,createFlashcardWithQuestion)

export default router;
