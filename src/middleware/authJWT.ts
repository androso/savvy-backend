import { error } from "console";
import { Response, Request, NextFunction } from "express";
import { jwtVerify, JWTPayload } from "jose";

interface ExtendedJWTPayload extends JWTPayload{
    id: number,
    google_id: string,
    email: string
}

declare module "express-serve-static-core" {
    interface Request {
        user?: ExtendedJWTPayload
    }
}


export async function authenticateToken(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<any> {
    const token =
        req.headers["authorization"]?.split(" ")[1] || req.cookies.token;

    if (!token) {
        return res.status(401).json({ error: "No token provided" });
    }

    try {
        const { payload } = await jwtVerify(
            token,
            new TextEncoder().encode(process.env.SECRET_KEY)
        );

        req.user = payload as ExtendedJWTPayload;
        
        next();
    } catch (error) {
        return res.status(401).json({ error: "Invalid Token" });
    }
}