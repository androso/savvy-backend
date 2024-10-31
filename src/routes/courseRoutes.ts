import { Router } from "express";
import { authenticateToken } from "../middleware/authJWT";
import { createCourse, deleteCourse, getCourses, getFlashcardsForTopic, getSuggestedTopics, getTopicsForCourse, updateCourse } from "../controllers/courses";

const router = Router();

export interface BaseCourse {
	course_id: number;
	user_id: number;
	course_name: string;
	description: string;
}

export interface CourseDB extends BaseCourse {
	created_at: string;
}

export interface Course {
	created_at: Date;
}

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     Course:
 *       type: object
 *       properties:
 *         course_id:
 *           type: integer
 *           format: int32
 *         user_id:
 *           type: integer
 *           format: int32
 *         course_name:
 *           type: string
 *           maxLength: 100
 *         created_at:
 *           type: string
 *           format: date-time
 *           default: current_timestamp
 *         description:
 *           type: string
 *           default: ""
 *       required:
 *         - course_id
 *         - user_id
 *         - course_name
 *         - description
 *       example:
 *         course_id: 1
 *         user_id: 123
 *         course_name: "Introduction to Programming"
 *         created_at: "2023-10-01T00:00:00Z"
 *         description: "A beginner's course on programming."
 * 
 * /courses:
 *   get:
 *     summary: Get all courses for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     tags: [Courses]
 *     responses:
 *       "200":
 *         description: Successful response with courses data
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/Course"
 *             examples:
 *               example1:
 *                 summary: A single course example
 *                 value:
 *                   - course_id: 1
 *                     user_id: 123
 *                     course_name: "Psicologia Infantil"
 *                     created_at: "2023-10-01T00:00:00Z"
 *                     description: "Curso dedicado al aprendizaje de la psicologia infantil"
 *       "500":
 *         description: Internal Server Error
 */
router.get("/", authenticateToken, getCourses);

/**
 * @swagger
 * /courses:
 *   post:
 *     summary: Create a new course for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     tags: [Courses]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               course_name:
 *                 type: string
 *                 description: The name of the course
 *                 example: "Introduction to Programming"
 *               description:
 *                 type: string
 *                 description: The description of the course
 *                 example: "A beginner's course on programming."
 *     responses:
 *       "201":
 *         description: Course created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Course"
 *       "400":
 *         description: Not enough arguments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *             example:
 *               error: "Not enough arguments"
 *       "500":
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *             example:
 *               error: "An unexpected error occurred."
 */

router.post("/", authenticateToken, createCourse);

/**
 * @swagger
 * /courses/{id}/topics:
 *   get:
 *     summary: Get all topics for a course
 *     security:
 *       - bearerAuth: []
 *     tags: [Topics]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The course ID
 *         schema:
 *           type: integer
 *     responses:
 *       "200":
 *         description: Successful response with topics data
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/Topic"
 *             examples:
 *               example1:
 *                 summary: A single topic example
 *                 value:
 *                   - topic_id: 1
 *                     course_id: 123
 *                     topic_name: "Introduction to Programming"
 *                     created_at: "2023-10-01T00:00:00Z"
 *                     description: "A beginner's course on programming."
 *       "500":
 *         description: Internal Server Error
 */
router.get("/:id/topics", authenticateToken, getTopicsForCourse);

/**
 * @swagger
 * /courses/{id}/topics/{topicId}/flashcards:
 *   get:
 *     summary: Get all flashcards for a topic
 *     security:
 *       - bearerAuth: []
 *     tags: [Flashcards]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The course ID
 *         schema:
 *           type: integer
 *       - in: path
 *         name: topicId
 *         required: true
 *         description: The topic ID
 *         schema:
 *           type: integer
 *     responses:
 *       "200":
 *         description: Successful response with flashcards data
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/Flashcard"
 *             examples:
 *               example1:
 *                 summary: A single flashcard example
 *                 value:
 *                   - flashcard_id: 1
 *                     topic_id: 123
 *                     question: "What is the capital of France?"
 *                     answer: "Paris"
 *                     created_at: "2023-10-01T00:00:00Z"
 *       "500":
 *         description: Internal Server Error
 */
router.get("/:id/topics/:topicId/flashcards", authenticateToken, getFlashcardsForTopic);

/**
 * @swagger
 * /courses/{id}:
 *   put:
 *     summary: Update a course
 *     security:
 *       - bearerAuth: []
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The course ID
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/Course"
 *     responses:
 *       "200":
 *         description: Course updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Course"
 *       "400":
 *         description: Not enough arguments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *             example:
 *               error: "Not enough arguments"
 *       "500":
 *         description: Internal Server Error
 */
router.put("/:id", authenticateToken, updateCourse);

/**
 * @swagger
 * /courses/{id}:
 *   delete:
 *     summary: Delete a course
 *     security:
 *       - bearerAuth: []
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The course ID
 *         schema:
 *           type: integer
 *     responses:
 *       "200":
 *         description: Course deleted successfully
 *       "500":
 *         description: Internal Server Error
 */
router.delete("/:id", authenticateToken, deleteCourse);

/**
 * @swagger
 * /courses/{id}/suggested-topics:
 *   get:
 *     summary: Get suggested topics for a course
 *     security:
 *       - bearerAuth: []
 *     tags: [Suggested Topics]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The course ID
 *         schema:
 *           type: integer
 *     responses:
 *       "200":
 *         description: Successful response with suggested topics data
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/Topic"
 *             examples:
 *               example1:
 *                 summary: A single topic example
 *                 value:
 *                   - topic_id: 1
 *                     course_id: 123
 *                     topic_name: "Introduction to Programming"
 *                     created_at: "2023-10-01T00:00:00Z"
 *                     description: "A beginner's course on programming."
 *       "500":
 *         description: Internal Server Error
 */
router.get("/:id/suggested-topics", authenticateToken, getSuggestedTopics);

export default router;
