import dotenv from "dotenv";
dotenv.config();
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import courseRoutes from "./routes/courseRoutes";
import userRoutes from "./routes/userRoutes";
import flashcard from "./routes/flashcardRoutes"
import swaggerEndPoint from "./swagger";
import assistantRoutes from "./routes/assistantRoutes";

const app = express();
const port = parseInt(process.env.PORT as string, 10) || 3000;

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use("/api/courses", courseRoutes);
app.use("/api/login", userRoutes);
app.use('/api/courses', flashcard);
app.use("/api/assistants", assistantRoutes);


app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
	console.error(err.stack);
	res.status(500).json({ error: err.message ?? "Internal server errror" });
});

app.listen(port, () => {
	console.log(`Server is running on port ${port}`);
	swaggerEndPoint(app, port);
});
