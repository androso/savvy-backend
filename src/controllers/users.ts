import type { NextFunction, Request, Response } from "express";
import supabase from "../database/db";
import { UserDb } from "../routes/userRoutes";
import { SignJWT } from "jose";
import { createAssistant } from "../openaiClient";

export const createUser = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
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

	const user = data as UserDb;
	if (!user || !user.google_id || !user.email) {
		res
			.status(500)
			.json({ error: "Invalid user data returned from the database" });
		return;
	}

	if (!user.oai_assistant_id) {
		try {
			const assistant = await createAssistant(user);
			// storing the assistant id in database
			await supabase
				.from("users")
				.update({ oai_assistant_id: assistant.id })
				.eq("user_id", user.user_id);
			
			// Update user variable with oai_assistant_id
			user.oai_assistant_id = assistant.id;
		} catch (error) {
			next(error);
		}
	}

	const encoder = new TextEncoder();
	const secretKey = encoder.encode(process.env.SECRET_KEY);
	const tokenjwt = await new SignJWT({
		id: user.user_id,
		google_id: user.google_id,
		email: user.email,
		display_name: user.display_name,
		profile_picture_url: user.profile_picture_url,
		assitant_id: user.oai_assistant_id
	})
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime("18h")
		.sign(secretKey);

	if (error) {
		res.status(500).json({ error: error.message });
	} else {
		res.cookie("token", tokenjwt, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
			maxAge: 18 * 60 * 60 * 1000, // 18 hours
		});
		res.status(200).json({ data: user, tokenjwt });
	}
};
