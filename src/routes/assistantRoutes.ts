import { Router } from "express";
import {
	addMessageToThread,
	createStepsList,
	createThread,
	openai,
} from "../openaiClient";
import { authenticateToken } from "../middleware/authJWT";
import { Message } from "openai/resources/beta/threads/messages";
import { AssistantMessage } from "../schemas/responseSchemas";
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

/**
 * @swagger
 * components:
 *   schemas:
 *     Message:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         content:
 *           type: string
 *         role:
 *           type: string
 *           enum: [user, assistant]
 *         created_at:
 *           type: integer
 */

/**
 * @swagger
 * /assistant/threads/{threadId}/messages:
 *   post:
 *     summary: Add a message to a thread and get AI response
 *     tags: [Assistant]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: threadId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the thread to add message to
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 description: The message content or topic to process
 *               messageType:
 *                 type: string
 *                 enum: [list, concept, eli5, flashcard, detail]
 *                 description: Type of response expected from the AI
 *               stepNumber:
 *                 type: number
 *                 description: Required for concept explanations
 *             required:
 *               - content
 *               - messageType
 *     responses:
 *       200:
 *         description: Message processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 type:
 *                   type: string
 *                   enum: [list, concept, eli5, flashcard, detail]
 *                 role:
 *                   type: string
 *                   enum: [assistant]
 *                 content:
 *                   type: object
 *                   description: Varies based on message type
 *                 stepNumber:
 *                   type: number
 *                   description: Present only for concept messages
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error
 */
router.post(
	"/threads/:threadId/messages",
	authenticateToken,
	async (req, res, next) => {
		try {
			const { threadId } = req.params;
			const { content, messageType, stepNumber } = req.body;

			// Store user message
			await openai.beta.threads.messages.create(threadId, {
				role: "user",
				content,
			});

			let response: AssistantMessage = {
				type: "list",
				role: "assistant",
				content: "",
			};

			switch (messageType) {
				case "list":
					const listResponse = await createStepsList(content);
					response = {
						type: "list",
						role: "assistant",
						content: listResponse,
					};
					break;

				case "concept":
					// const conceptResponse = await explainConcept(content, stepNumber);
					response = {
						type: "concept",
						role: "assistant",
						content: "",
						stepNumber,
					};

					break;

				// Additional cases for eli5, flashcard, detail...
			}

			// Store assistant response
			await openai.beta.threads.messages.create(threadId, {
				role: "assistant",
				content: JSON.stringify(response),
			});

			res.json(response);
		} catch (e) {
			next(e);
		}
	}
);

export default router;
