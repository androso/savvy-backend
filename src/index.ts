import dotenv from "dotenv";
dotenv.config();
import express, { Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import courseRoutes from "./routes/courseRoutes";
import userRoutes from "./routes/userRoutes";
import flashcard from "./routes/flashcard";
import swaggerEndPoint from "./swagger";

const app = express();
const port = parseInt(process.env.PORT as string, 10) || 3000;

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use("/api/courses", courseRoutes);
app.use("/api/login", userRoutes);
app.use("/api/flashcards", flashcard);

app.use((err: Error, req: Request, res: Response) => {
	console.error(err.stack);
	res.status(500).json({ error: err.message ?? "Internal server errror" });
});

app.listen(port, () => {
	console.log(`Server is running on port ${port}`);
	swaggerEndPoint(app, port);
});