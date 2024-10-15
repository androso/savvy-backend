import { Router } from "express";
import supabase from "../database/db";
import { SignJWT } from "jose";

const router = Router();

router.post("/api/login", async (req, res) => {
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
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
			maxAge: 2 * 60 * 60 * 1000, // 2 hours
		});
		res.status(200).json({ data, tokenjwt });
	}
});

export default router;
