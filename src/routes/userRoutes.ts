import { Router } from "express";
import { createUser } from "../controllers/users";

const router = Router();

export interface BaseUser {
	google_id: string;
	email: string;
	display_name: string;
	profile_picture_url: string;
	user_id: number;
}

export interface UserDb extends BaseUser {
	created_at: string;
	last_login: string;
}

export interface JwtUser extends Omit<BaseUser, "user_id"> {
	id: number;
	created_at: Date;
	last_login: Date;
}

router.post("/", createUser);

export default router;
