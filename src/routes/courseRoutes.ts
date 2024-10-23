import { Router } from "express";
import { authenticateToken } from "../middleware/authJWT";
import supabase from "../database/db";
import OpenAI from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import validUUID from '../helpers/validUUID'

const router = Router();

interface BaseCourse {
	course_id: number;
	user_id: number;
	course_name: string;
	description: string | null;
}

interface CourseDB extends BaseCourse {
	created_at: string;
}

interface Course {
	created_at: Date;
}

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

router.get('/:id/topics', authenticateToken, async (req, res) => {
    try {
        //try get the user_id
        const user_id = req.user?.id;
		const course_id = req.params.id;

        //get the current topic of client 
        const { data, error } = await supabase
            .from('courses')
            .select('course_id')
            .eq('user_id', user_id);

        if (error) {
            res.status(500).json({ error: error.message });
            return;
        }

        if (!data || data.length === 0) {
            res.status(404).json({ error: 'No courses found for this user' });
            return;
        }

        const { data: topics, error: topicsError } = await supabase
            .from('topics')
            .select('*')
            .eq('course_id', course_id);

        if (topicsError) {
            res.status(500).json({ error: topicsError.message });
        }
        res.status(200).json({ data: topics });
    }
    catch (error) {
        res.status(500).json({ error });
    }

})

router.get('/:id/topics/:topicId/flashcards', authenticateToken, (req, res)=>{
	try{
		const user_id = req.user?.id;
		const course_id = req.params.id;
		const topic_id = req.params.topicId;
		if(!validUUID(topic_id)){
			res.status(400).json({error: "Invalid course_id or topic_id."});
			return;
		}

		supabase
			.from('topics')
			.select('topic_id')
			.eq('course_id', course_id)
			.then(({data: topics, error: topicsError})=>{
				if(topicsError){
					res.status(500).json({error: topicsError.message});
					return;
				}
				if(!topics || topics.length === 0){
					res.status(404).json({message: "No topics found for the user."})
					return;
				}
				const topicIds = topics.map((topic: any) => topic.topic_id)
				supabase
					.from('flashcards')
					.select('*')
					.in('topic_id', topicIds)
					.then(({data: flashcards, error: flashcardsError})=>{
						if(flashcardsError){
							res.status(500).json({error: flashcardsError.message});
							return;
						}
						res.status(200).json({flashcards});
					})
			})
	}catch(error){
		res.status(500).json({ error: 'An unexpected error occurred.' });
	}
})


router.post("/", authenticateToken, async (req, res) => {
	const { course_name, description } = req.body;
	const user_id = req.user?.id;

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
});

router.delete("/:id", authenticateToken, async (req, res) => {
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
});

router.get("/:id/suggested-topics", authenticateToken, async (req, res) => {
	const courseId = parseInt(req.params.id);
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

		const openai = new OpenAI();
		const suggestedTopicsList = z.object({
			topics: z.array(z.string()),
		});

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

		const courseTitle = course.course_name;
		const courseDescription = course.description;

		try {
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

			const topics = completion.choices[0].message.parsed?.topics;

			if (topics) {
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
});

export default router;
