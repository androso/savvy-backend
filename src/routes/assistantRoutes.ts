import { Router } from "express";
import { createStepsList, createThread, openai } from "../openaiClient";
import { authenticateToken } from "../middleware/authJWT";
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
		const { course_name } = req.body;
		const thread = await createThread();
		const initialMessage = {
			type: "normal",
			role: "assistant",
			content: `Hablemos sobre ${course_name}. ¿Qué te gustaría saber al respecto?`,
		};
		res.status(201).json({
			data: {
				...thread,
				messages: [initialMessage],
			},
		});
	} catch (e) {
		next(e);
	}
});

/**
 * @swagger
 * components:
 *   schemas:
 *     ThreadMessage:
 *       type: object
 *       properties:
 *         type:
 *           type: string
 *           enum: [normal, list, concept, eli5, flashcard, detail]
 *         role:
 *           type: string
 *           enum: [user, assistant]
 *         content:
 *           type: string
 *         stepNumber:
 *           type: number
 *           description: Only present for concept type messages
 *     ThreadResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/Thread'
 *         - type: object
 *           properties:
 *             messages:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ThreadMessage'
 *
 * /assistant/threads/{threadId}:
 *   get:
 *     summary: Retrieve a thread with its messages
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
 *       - in: query
 *         name: course_name
 *         required: false
 *         schema:
 *           type: string
 *         description: Name of the course for the welcome message
 *     responses:
 *       200:
 *         description: Thread and messages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/ThreadResponse'
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
		const { course_name } = req.query;

		// Get both thread and messages in parallel
		const [thread, messages] = await Promise.all([
			openai.beta.threads.retrieve(threadId),
			openai.beta.threads.messages.list(threadId),
		]);

		const formattedMessages = [
			// Initial welcome message
			{
				type: "normal",
				role: "assistant",
				content: `Hablemos sobre ${course_name}. ¿Qué te gustaría saber al respecto?`,
			},
			// Map messages in reverse for chronological order
			...(messages.data as OpenAIMessage[])
				.reverse()
				.map((msg) => {
					try {
						if (!msg.content[0]?.text?.value) {
							throw new Error("Invalid message format");
						}

						if (msg.role === "assistant") {
							try {
								return JSON.parse(msg.content[0].text.value);
							} catch {
								return {
									type: "normal",
									role: "assistant",
									content: msg.content[0].text.value,
								};
							}
						}

						return {
							type: "normal",
							role: "user",
							content: msg.content[0].text.value,
						};
					} catch (error) {
						console.error("Error processing message:", error);
						return null;
					}
				})
				.filter(Boolean),
		];

		res.status(200).json({
			data: {
				...thread,
				messages: formattedMessages,
			},
		});
	} catch (e) {
		next(e);
	}
});

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
 *                 data:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       enum: [list, concept, eli5, flashcard, detail]
 *                     role:
 *                       type: string
 *                       enum: [assistant]
 *                     content:
 *                       type: object
 *                       properties:
 *                         headerText:
 *                           type: string
 *                           description: Introductory text explaining the content
 *                         steps:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               order:
 *                                 type: number
 *                                 description: Step number/order
 *                               title:
 *                                 type: string
 *                                 description: Step title/content
 *                       required:
 *                         - headerText
 *                         - steps
 *                     stepNumber:
 *                       type: number
 *                       description: Present only for concept messages
 *                   required:
 *                     - type
 *                     - role
 *                     - content
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

			res.status(201).json({
				data: response
			});
		} catch (e) {
			next(e);
		}
	}
);

interface OpenAIMessage {
	id: string;
	role: "user" | "assistant";
	content: Array<{
		type: "text";
		text: {
			value: string;
			annotations: any[];
		};
	}>;
}

/**
 * @swagger
 * /assistant/threads/{threadId}/messages:
 *   get:
 *     summary: Retrieve messages from a thread
 *     tags: [Assistant]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: threadId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the thread to retrieve messages from
 *       - in: query
 *         name: course_name
 *         required: false
 *         schema:
 *           type: string
 *         description: Name of the course for the welcome message
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 messages:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ThreadMessage'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Thread not found
 *       500:
 *         description: Internal Server Error
 */

router.get(
	"/threads/:threadId/messages",
	authenticateToken,
	async (req, res, next) => {
		try {
			const { threadId } = req.params;
			const { course_name } = req.query;
			const messages = await openai.beta.threads.messages.list(threadId);

			const formattedMessages = [
				// Initial welcome message
				{
					type: "normal",
					role: "assistant",
					content: `Hablemos sobre ${course_name}. ¿Qué te gustaría saber al respecto?`,
				},
				// Map messages in reverse to maintain chronological order
				...(messages.data as OpenAIMessage[])
					.reverse()
					.map((msg) => {
						try {
							// Safety check for message structure
							if (!msg.content[0]?.text?.value) {
								throw new Error("Invalid message format");
							}

							if (msg.role === "assistant") {
								try {
									// Parse stored JSON response
									return JSON.parse(msg.content[0].text.value);
								} catch {
									// Fallback for unparseable assistant messages
									return {
										type: "normal",
										role: "assistant",
										content: msg.content[0].text.value,
									};
								}
							}

							// User messages are always normal type
							return {
								type: "normal",
								role: "user",
								content: msg.content[0].text.value,
							};
						} catch (error) {
							console.error("Error processing message:", error);
							return null;
						}
					})
					.filter(Boolean), // Remove any null messages from errors
			];

			res.json({ messages: formattedMessages });
		} catch (e) {
			next(e);
		}
	}
);

export default router;