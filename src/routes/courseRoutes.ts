import { Router } from "express";
import { authenticateToken } from "../middleware/authJWT";
import supabase from "../database/db";
import OpenAI from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";

const router = Router();

router.get("/", authenticateToken, async (req, res) => {
	const user_id = req.user?.id;

	const { data, error } = await supabase
		.from("courses")
		.select("*")
		.eq("user_id", user_id);

	if (error) {
		res.status(500).json({ error: error.message });
	} else {
		res.status(200).json({ data });
	}
});

router.post("/", authenticateToken, async (req, res) => {
	const { course_name, description } = req.body;
	const user_id = req.user.id;

	if (!user_id || !course_name || !description) {
		res.status(400).json({ error: "Not enough arguments" });
	} else {
		const { data, error } = await supabase
			.from("courses")
			.insert({ user_id, course_name, description })
			.select("*")
			.single();

		if (error) {
			res.status(500).json({ error: error.message });
		} else {
			res.status(201).json({ data });
		}
	}
});

router.put("/:id", authenticateToken, async (req, res) => {
	const { id } = req.params;
	const { course_name, description } = req.body;
	const user_id = req.user.id;

	const updateData: any = {};
	if (course_name != null) updateData.course_name = course_name;
	if (description != null) updateData.description = description;

	const { data, error } = await supabase
		.from("courses")
		.update(updateData)
		.eq("course_id", id)
		.eq("user_id", user_id)
		.single();

	if (error) {
		res.status(500).json({ error: error.message });
	} else {
		res.status(200).json({ data });
	}
});

router.delete("/:id", authenticateToken, async (req, res) => {
	const { id } = req.params;
	const user_id = req.user.id;

	const { data, error } = await supabase
		.from("courses")
		.delete()
		.eq("course_id", id)
		.eq("user_id", user_id)
		.single();

	if (error) {
		res.status(500).json({ error: error.message });
	} else {
		res.status(200).json({ data });
	}
});

export default router;