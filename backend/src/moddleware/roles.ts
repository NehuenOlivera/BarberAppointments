import { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";

export function isBarberOrAdmin(req: Request, res: Response, next: NextFunction) {
  const user = req.user as { role: Role; id: number };

  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (user.role === Role.ADMIN || user.role === Role.BARBER) {
    return next();
  }

  return res.status(403).json({ message: "Access denied" });
}