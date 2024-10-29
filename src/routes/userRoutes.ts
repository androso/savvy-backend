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

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         google_id:
 *           type: string
 *         email:
 *           type: string
 *         display_name:
 *           type: string
 *         profile_picture_url:
 *           type: string
 *         last_login:
 *           type: string
 *           format: date-time
 *       required:
 *         - google_id
 *         - email
 *         - display_name
 *         - profile_picture_url
 *         - last_login
 *       example:
 *         google_id: "1234567890"
 *         email: "user@example.com"
 *         display_name: "John Doe"
 *         profile_picture_url: "http://example.com/profile.jpg"
 *         last_login: "2023-10-01T00:00:00Z"
 *  
 * /users:
 *   post:
 *     summary: Create or Log an user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: User created or updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *                 tokenjwt:
 *                   type: string
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal Server Error
 */
router.post("/", createUser);

export default router;
