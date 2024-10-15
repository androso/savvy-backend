import express from "express";
import dotenv from "dotenv";

import cors from "cors";
import { SignJWT } from "jose";
import { authenticateToken } from "./middleware/authJWT";
import cookieParser from "cookie-parser";

dotenv.config();
import supabase from "./database/db";

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());
app.use(cookieParser());

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

	if (!data || !data.google_id || !data.email) {
		res
			.status(500)
			.json({ error: "Invalid user data returned from the database" });
		return;
	}

	const encoder = new TextEncoder();
	const secretKey = encoder.encode(process.env.SECRET_KEY);
	const tokenjwt = await new SignJWT({
		id: data.id,
		gooogle_id: data.google_id,
		email: data.email,
	})
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime("2h")
		.sign(secretKey);

	if (error) {
		res.status(500).json({ error: error.message });
	} else {
		res.cookie("token", tokenjwt, {
			httpOnly: true,
			secure: process.env.SECRET_KEY === "API-SECRET",
			sameSite: "strict",
			maxAge: 2 * 60 * 60 * 1000, // 2 hours
		});
		res.status(200).json({ data, tokenjwt });
	}
});

// Protected route example
app.get(
	"/api/protected",
	authenticateToken,
	(req: express.Request, res: express.Response) => {
		res.json({ message: "Protected route" });
	}
);

app
	.route("/api/courses")
	.get(authenticateToken, async (req, res) => {
		const user_id = req.user?.id;

		if (!user_id) {
			res.status(400).json({ error: "User ID is required" });
		} else {
			const { data, error } = await supabase
				.from("courses")
				.select("*")
				.eq("user_id", user_id);

			if (error) {
				res.status(500).json({ error: error.message });
			} else {
				res.status(200).json({ data });
			}
		}
	})
	.post(authenticateToken, async (req, res) => {
		const { user_id, course_name, description } = req.body;
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
	});
app
	.route("/api/courses/:id")
	.delete(authenticateToken, async (req, res) => {
		const id = req.user?.id;

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
	.put(authenticateToken, async (req, res) => {
		const { id } = req.params;
		const { course_name, description } = req.body;

		const updateData: any = {};
		if (course_name != null) updateData.course_name = course_name;
		if (description != null) updateData.description = description;

		const { data, error } = await supabase
			.from("courses")
			.update(updateData)
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
