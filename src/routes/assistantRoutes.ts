import { Router } from "express";
import { createThread, openai } from "../openaiClient";
import { authenticateToken } from "../middleware/authJWT";
import type { Thread } from "openai/resources/beta/threads/threads";
const router = Router();

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
