import express from "express";
import dotenv from "dotenv";
import cors from "cors";
dotenv.config();
import supabase from "./database/db";

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.post("/api/save-user", async (req, res) => {
	const { google_id, email, display_name, profile_picture_url, last_login } =
		req.body;

	const { data, error } = await supabase
		.from("users")
		.upsert(
			{ google_id, email, display_name, profile_picture_url, last_login },
			{ onConflict: "google_id" }
		)
		.select("*")
		.single();

	if (error) {
		res.status(500).json({ error: error.message });
	} else {
		res.status(200).json({ data });
	}
});

app
	.route("/api/courses")
	.get(async (req, res) => {
		const { user_id } = req.query;

		if (!user_id) {
			res.status(400).json({ error: "User ID is required" });
		}

		const { data, error } = await supabase
			.from("courses")
			.select("*")
			.eq("user_id", user_id);

		if (error) {
			res.status(500).json({ error: error.message });
		} else {
			res.status(200).json({ data });
		}
	})
	.post(async (req, res) => {
		const { user_id, course_name } = req.body;
		if (!user_id || !course_name) {
			res.status(400).json({ error: "Not enough arguments" });
		} else {
			const { data, error } = await supabase
				.from("courses")
				.insert({ user_id, course_name })
				.select("*")
				.single();
			if (error) {
				res.status(500).json({ error: error.message });
			} else {
				res.status(201).json({ data });
			}
		}
	});
app
	.route("/api/courses/:id")
	.delete(async (req, res) => {
		const { id } = req.params;

		const { data, error } = await supabase
			.from("courses")
			.delete()
			.eq("course_id", id)
			.single();

		if (error) {
			res.status(500).json({ error: error.message });
		} else {
			res.status(200).json({ data });
		}
	})
	.put(async (req, res) => {
		const { id } = req.params;
		const { course_name } = req.body;

		const { data, error } = await supabase
			.from("courses")
			.update({ course_name })
			.eq("course_id", id)
			.single();

		if (error) {
			res.status(500).json({ error: error.message });
		} else {
			res.status(200).json({ data });
		}
	});

app.listen(port, () => {
	console.log(`Server is running on port ${port}`);
});
