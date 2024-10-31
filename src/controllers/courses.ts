import supabase from "../database/db";
import type { Request, Response } from "express";
import isValidUUID from "../helpers/validUUID";
import { CourseDB } from "../routes/courseRoutes";
import { createSuggestedTopics, openai } from "../openaiClient";

export const getCourses = async (req: Request, res: Response) => {
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
};

export const getTopicsForCourse = async (req: Request, res: Response) => {
	try {
		//try get the user_id
		const user_id = req.user?.id;
		const course_id = req.params.id;

		//get the current topic of client
		const { data, error } = await supabase
			.from("courses")
			.select("course_id")
			.eq("user_id", user_id);

		if (error) {
			res.status(500).json({ error: error.message });
			return;
		}

		if (!data || data.length === 0) {
			res.status(404).json({ error: "No courses found for this user" });
			return;
		}

		const { data: topics, error: topicsError } = await supabase
			.from("topics")
			.select("*")
			.eq("course_id", course_id);

		if (topicsError) {
			res.status(500).json({ error: topicsError.message });
		}
		res.status(200).json({ data: topics });
	} catch (error) {
		res.status(500).json({ error });
	}
};

export const getFlashcardsForTopic = (req: Request, res: Response) => {
	try {
		const user_id = req.user?.id;
		const course_id = req.params.id;
		const topic_id = req.params.topicId;
		if (!isValidUUID(topic_id)) {
			res.status(400).json({ error: "Invalid course_id or topic_id." });
			return;
		}

		supabase
			.from("topics")
			.select("topic_id")
			.eq("course_id", course_id)
			.then(({ data: topics, error: topicsError }) => {
				if (topicsError) {
					res.status(500).json({ error: topicsError.message });
					return;
				}
				if (!topics || topics.length === 0) {
					res.status(404).json({ message: "No topics found for the user." });
					return;
				}
				const topicIds = topics.map((topic: any) => topic.topic_id);
				supabase
					.from("flashcards")
					.select("*")
					.in("topic_id", topicIds)
					.then(({ data: flashcards, error: flashcardsError }) => {
						if (flashcardsError) {
							res.status(500).json({ error: flashcardsError.message });
							return;
						}
						res.status(200).json({ flashcards });
					});
			});
	} catch (error) {
		res.status(500).json({ error: "An unexpected error occurred." });
	}
};

export const createCourse = async (req: Request, res: Response) => {
	const { course_name, description } = req.body;
	const user_id = req.user?.id;

	if (!user_id || !course_name) {
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
};

export const updateCourse = async (req: Request, res: Response) => {
	const { id } = req.params;
	const { course_name, description } = req.body;
	const user_id = req.user?.id;

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
};

export const deleteCourse = async (req: Request, res: Response) => {
	const { id } = req.params;
	const user_id = req.user?.id;

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
};

export const getSuggestedTopics = async (req: Request, res: Response) => {
	const courseId = req.params.id;
	const user_id = req.user?.id;

	if (courseId) {
		const { data: suggestedTopics, error: suggestedTopicsError } =
			await supabase
				.from("suggested_topics")
				.select("*")
				.eq("course_id", courseId);

		if (suggestedTopicsError) {
			res.status(500).json({ error: suggestedTopicsError.message });
			return;
		}

		if (suggestedTopics && suggestedTopics.length > 0) {
			res.status(200).json({ topics: suggestedTopics });
			return;
		}

		const { data, error } = await supabase
			.from("courses")
			.select("*")
			.eq("course_id", courseId)
			.eq("user_id", user_id)
			.single();

		const course = data as CourseDB;

		if (error || !course) {
			res
				.status(404)
				.json({ error: "Course not found or you do not have access to it" });
			return;
		}

		try {
			const courseTitle = course.course_name;
			const courseDescription = course.description;

			const topics = await createSuggestedTopics(
				courseTitle,
				courseDescription
			);

			if (topics.length > 0) {
				const insertedTopics = [];
				for (const topic of topics) {
					const { data } = await supabase
						.from("suggested_topics")
						.insert({
							topic_name: topic,
							course_id: courseId,
						})
						.select("*")
						.single();

					insertedTopics.push(data);
				}
				res.status(200).json({ topics: insertedTopics });
				return;
			}
		} catch (err) {
			res.status(500).json({ error: err });
			return;
		}
	} else {
		res
			.status(400)
			.json({ error: "Course title and description are required" });
		return;
	}
};
