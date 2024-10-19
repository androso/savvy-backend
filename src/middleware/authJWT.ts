import { error } from "console";
import { Response, Request, NextFunction } from "express";
import { jwtVerify, JWTPayload } from "jose";
import supabase from "../database/db";
import { JwtUser } from "../routes/userRoutes";

declare module "express-serve-static-core" {
	interface Request {
		user?: JwtUser;
	}
}

export async function authenticateToken(
	req: Request,
	res: Response,
	next: NextFunction
) {
	const token =
		req.headers["authorization"]?.split(" ")[1] || req.cookies.token;

	if (!token) {
		res.status(401).json({ error: "No token provided" });
		return;
	}

	try {
		const { payload } = await jwtVerify(
			token,
			new TextEncoder().encode(process.env.SECRET_KEY)
		);

		const { data: user, error: dbError } = await supabase
			.from("users")
			.select("*")
			.eq("google_id", payload.google_id)
			.single();

		if (dbError || !user) {
			return res.status(401).json({ error: "User not found" });
		}

		req.user = user as JwtUser;

		next();
	} catch (error) {
		res.status(401).json({ error: "Invalid Token" });
		return;
	}
}
