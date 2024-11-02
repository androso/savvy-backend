import swaggerJsDoc from "swagger-jsdoc";
import swaggerUI from "swagger-ui-express";
import { Express, Request, Response } from "express";

const swaggerOptions = {
	definition: {
		openapi: "3.0.0",
		info: {
			title: "API Tutor Inteligente - Savvy",
			description: "API para el proyecto de Tutor Inteligente de Savvy",
			version: "1.0.0",
		},
	},
	apis: ["./src/routes/*.ts"],
};

//Documentación de la API JSON
const swaggerSpec = swaggerJsDoc(swaggerOptions);

const swaggerDocs = (app: Express, port: number) => {
	app.use("/docs", swaggerUI.serve, swaggerUI.setup(swaggerSpec));
	app.get("/docs.json", (req: Request, res: Response) => {
		res.setHeader("Content-Type", "application/json");
		res.send(swaggerSpec);
	});
	console.log(`Documentación disponible en http://localhost:${port}/docs.json`);
};

export default swaggerDocs;
