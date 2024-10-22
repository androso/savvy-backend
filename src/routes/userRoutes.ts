import { Router } from "express";
import supabase from "../database/db";
import { SignJWT } from "jose";

const router = Router();

interface BaseUser {
	google_id: string;
	email: string;
	display_name: string;
	profile_picture_url: string;
	user_id: number;
}

interface UserDb extends BaseUser {
	created_at: string;
	last_login: string;
}

export interface JwtUser extends Omit<BaseUser, "user_id"> {
	id: number
	created_at: Date
	last_login: Date
}

router.post("/", async (req, res) => {
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
});

export default router;
