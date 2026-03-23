import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
  userId: string;
  userPlan: string;
}

/**
 * Verifies the Bearer JWT sent by the Next.js frontend.
 * Attaches userId and userPlan to the request object.
 */
export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or malformed authorization header" });
    return;
  }

  const token = authHeader.slice(7);
  const secret = process.env.NEXTAUTH_SECRET;

  if (!secret) {
    res.status(500).json({ error: "Server misconfiguration" });
    return;
  }

  try {
    const payload = jwt.verify(token, secret) as {
      sub: string;
      plan?: string;
    };
    (req as AuthenticatedRequest).userId = payload.sub;
    (req as AuthenticatedRequest).userPlan = payload.plan ?? "starter";
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

/**
 * Middleware that verifies the internal API secret used for
 * service-to-service calls (e.g., agent containers calling the API).
 */
export function requireApiSecret(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const secret = req.headers["x-api-secret"];
  if (secret !== process.env.API_SECRET_KEY) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}
