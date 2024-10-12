import { Response, Request, NextFunction } from "express";
import { jwtVerify, JWTPayload } from "jose";

declare module 'express-serve-static-core' {
    interface Request {
        user?: JWTPayload | string;
    }
}

export async function authenticateToken( req: Request, res: Response, next: NextFunction): Promise<any> {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.sendStatus(401)
    // res.status(401).send("Unauthorized")
    try {
        const {payload} = await jwtVerify(token, new TextEncoder().encode(process.env.SECRET_KEY))
        req.user = payload;
        return next();
    } catch (error) {
        return res.sendStatus(403)
    }

}