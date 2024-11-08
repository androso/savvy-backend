import { z } from "zod";

export const stepListSchema = z.object({
  headerText: z.string(),
  steps: z.array(z.object({
    order: z.number(),
    title: z.string()
  }))
});

export const conceptExplanationSchema = z.object({
  htmlContent: z.string(),
  rawContent: z.string() 
});

export type MessageType = "list" | "concept" | "eli5" | "flashcard" | "detail" | "normal";

export interface AssistantMessage {
  type: MessageType;
  role: "assistant" | "user";
  content: any; // Type varies by message type
  stepNumber?: number;
}

export type StepListResponse = z.infer<typeof stepListSchema>;