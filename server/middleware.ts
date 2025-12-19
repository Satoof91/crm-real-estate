import type { Request, Response, NextFunction } from "express";

// Extend Express Request to include user
declare global {
  namespace Express {
    interface User {
      id: string;
      username: string;
      email: string;
      fullName: string;
      role: string;
      createdAt: Date;
    }
  }
}

// Middleware to check if user is authenticated
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Unauthorized. Please login first." });
}

// Middleware to check if user has admin role
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() && req.user?.role === "admin") {
    return next();
  }
  res.status(403).json({ error: "Forbidden. Admin access required." });
}

// Middleware to check if user has manager or admin role
export function isManagerOrAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() && (req.user?.role === "admin" || req.user?.role === "manager")) {
    return next();
  }
  res.status(403).json({ error: "Forbidden. Manager or admin access required." });
}
