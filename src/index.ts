import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import courseRoutes from "./routes/courseRoutes";
import userRoutes from "./routes/userRoutes";

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use("/api/courses", courseRoutes);
app.use("/api/login", userRoutes);

app.listen(port, () => {
	console.log(`Server is running on port ${port}`);
});