import type { Request, Response } from "express";
import supabase from "../database/db";
import { UserDb } from "../routes/userRoutes";
import { SignJWT } from "jose";

export const createUser = async (req: Request, res: Response) => {
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
	const user = data as UserDb;
	const encoder = new TextEncoder();
	const secretKey = encoder.encode(process.env.SECRET_KEY);
	const tokenjwt = await new SignJWT({
		id: user.user_id,
		google_id: data.google_id,
		email: data.email,
		display_name: user.display_name,
		profile_picture_url: user.profile_picture_url,
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
		res.status(200).json({ data, tokenjwt });
	}
};
