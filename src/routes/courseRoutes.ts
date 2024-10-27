import { Router } from "express";
import { authenticateToken } from "../middleware/authJWT";
import supabase from "../database/db";
import OpenAI from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import validUUID from "../helpers/validUUID";
import { createCourse, deleteCourse, getCourses, getFlashcardsForTopic, getSuggestedTopics, getTopicsForCourse, updateCourse } from "../controllers/courses";

const router = Router();

export interface BaseCourse {
	course_id: number;
	user_id: number;
	course_name: string;
	description: string | null;
}

export interface CourseDB extends BaseCourse {
	created_at: string;
}

export interface Course {
	created_at: Date;
}

router.get("/", authenticateToken, getCourses);

router.get("/:id/topics", authenticateToken, getTopicsForCourse);

router.get("/:id/topics/:topicId/flashcards", authenticateToken, getFlashcardsForTopic);

router.post("/", authenticateToken, createCourse);

router.put("/:id", authenticateToken, updateCourse);

router.delete("/:id", authenticateToken, deleteCourse);

router.get("/:id/suggested-topics", authenticateToken, getSuggestedTopics);

export default router;
