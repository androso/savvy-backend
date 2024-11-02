import OpenAI from "openai";
import dotenv from "dotenv";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import { UserDb } from "./routes/userRoutes";
import { createHash } from "crypto";
dotenv.config();

export const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

export async function createAssistant(user: UserDb) {
	try {
		const userTutorId = createHash("sha256")
			.update(`Tutor-${user.google_id}-${user.email}-${user.user_id}`)
			.digest("hex");

		const assistant = await openai.beta.assistants.create({
			name: userTutorId,
			instructions:
				"You are an AI tutor helping students with their questions.",
			model: "gpt-4-1106-preview",
		});

		return assistant;
	} catch (error) {
		console.error("Error creating assistant:", error);
		throw new Error("Failed to create assistant");
	}
}

export async function createThread() {
	try {
		const thread = await openai.beta.threads.create();
		return thread;
	} catch (error) {
		console.error(error);
		throw new Error("Failed to create thread");
	}
}

export async function addMessageToThread(threadId: string, content: string) {
	try {
		const message = await openai.beta.threads.messages.create(threadId, {
			role: "user",
			content: content,
		});
		console.log("Message added to thread:", message);
		return message;
	} catch (error) {
		console.error("Error adding message to thread:", error);
	}
}

export async function runAssistant(assistantId: string, threadId: string) {
	try {
		const run = await openai.beta.threads.runs.create(threadId, {
			assistant_id: assistantId,
		});
		console.log("Assistant run started:", run);
		return run;
	} catch (error) {
		console.error("Error running assistant:", error);
	}
}

export async function createSuggestedTopics(
	courseTitle: string,
	courseDescription: string
) {
	const suggestedTopicsList = z.object({
		topics: z.array(z.string()),
	});

	const completion = await openai.beta.chat.completions.parse({
		model: "gpt-4o-mini",
		messages: [
			{
				role: "system",
				content:
					"Eres un profesor super util, sabes como dividir un tema en multiples partes para que tus estudiantes aprendar de una mejor manera y más rápido",
			},
			{
				role: "user",
				content: `
						Te daré un título de curso y también una descripción del curso, tu tarea es devolver una lista de 5 temas sugeridos para empezar a aprender sobre el tema.
						título del curso: ${courseTitle}
						descripción del curso: ${courseDescription}
					`,
			},
		],
		response_format: zodResponseFormat(suggestedTopicsList, "topicsList"),
	});

	return completion.choices[0].message.parsed?.topics ?? [];
}
