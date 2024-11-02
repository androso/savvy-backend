import { Router } from "express";
import { createThread, openai } from "../openaiClient";
import { authenticateToken } from "../middleware/authJWT";
const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Thread:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         object:
 *           type: string
 *         created_at:
 *           type: integer
 *         metadata:
 *           type: object
 * 
 * /assistant/threads:
 *   post:
 *     summary: Create a new thread
 *     tags: [Assistant]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       201:
 *         description: Thread created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Thread'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error
 */
router.post("/threads", authenticateToken, async (req, res, next) => {
	try {
		const thread = await createThread();
		res.status(201).json({
			data: thread,
		});
	} catch (e) {
		next(e);
	}
});

/**
 * @swagger
 * /assistant/threads/{threadId}:
 *   get:
 *     summary: Retrieve a specific thread
 *     tags: [Assistant]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: threadId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the thread to retrieve
 *     responses:
 *       200:
 *         description: Thread retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Thread'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Thread not found
 *       500:
 *         description: Internal Server Error
 */
router.get("/threads/:threadId", authenticateToken, async (req, res, next) => {
	try {
		const { threadId } = req.params;

		//TODO: add validation to see if the thread belongs to user
		const thread = await openai.beta.threads.retrieve(threadId);
		res.status(200).json({
			data: thread,
		});
	} catch (e) {
		next(e);
	}
});

export default router;
