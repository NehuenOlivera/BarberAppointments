import express, { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateJWT } from "../moddleware/auth";
import { isBarberOrAdmin } from "../moddleware/roles";

const prisma = new PrismaClient();
const router = express.Router();

// ✅ GET all availibilities
router.get("/", async (_req: Request, res: Response) => {
    try {
        const availabilities = await prisma.availability.findMany({
            orderBy: [{ barberId: "asc" }, { weekday: "asc" }],
        });
        res.json(availabilities);
    } catch (error) {
        console.error("Error fetching availability:", error);
        res.status(500).json({ error: "Error fetching availability" });
    }
});

// Get availability for a specific barber
router.get("/:barberId", authenticateJWT, async (req: Request, res: Response) => {
    try {
        const { barberId } = req.params;
        const availabilities = await prisma.availability.findMany({
            where: { barberId: Number(barberId) },
            orderBy: [{ weekday: "asc" }],
        });
        res.json(availabilities);
    } catch (error) {
        console.error("Error fetching availability:", error);
        res.status(500).json({ error: "Error fetching availability" });
    }
});

// ✅ POST: sólo barber o admin
router.post("/", authenticateJWT, isBarberOrAdmin, async (req: Request, res: Response) => {
  try {
    const { barberId, availabilities } = req.body;
    const user = req.user as { id: number; role: string };

    if (!barberId || !Array.isArray(availabilities)) {
      return res.status(400).json({ error: "Missing barberId or availabilities" });
    }

    // Si el usuario es BARBER, solo puede modificar su propia disponibilidad
    if (user.role === "BARBER") {
      const barber = await prisma.barber.findUnique({ where: { userId: user.id } });
      if (!barber || barber.id !== barberId) {
        return res.status(403).json({ error: "Cannot modify another barber's availability" });
      }
    }

    const created = await prisma.availability.createMany({
      data: availabilities.map((a) => ({
        barberId: Number(barberId),
        weekday: a.weekday,
        startHour: a.startHour,
        endHour: a.endHour,
      })),
    });

    res.status(201).json({ message: "Availabilities created", count: created.count });
  } catch (error) {
    console.error("Error creating availability:", error);
    res.status(500).json({ error: "Error creating availability" });
  }
});

// ✅ PUT: sólo barber o admin
router.put("/:id", authenticateJWT, isBarberOrAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { startHour, endHour } = req.body;
    const user = req.user as { id: number; role: string };

    const existing = await prisma.availability.findUnique({
      where: { id: Number(id) },
      include: { barber: true },
    });

    if (!existing) {
      return res.status(404).json({ error: "Availability not found" });
    }

    if (user.role === "BARBER") {
      const barber = await prisma.barber.findUnique({ where: { userId: user.id } });
      if (!barber || barber.id !== existing.barberId) {
        return res.status(403).json({ error: "Cannot modify another barber's availability" });
      }
    }

    const updated = await prisma.availability.update({
      where: { id: Number(id) },
      data: { startHour, endHour },
    });

    res.json({ message: "Availability updated", updated });
  } catch (error) {
    console.error("Error updating availability:", error);
    res.status(500).json({ error: "Error updating availability" });
  }
});

// ✅ DELETE: sólo barber o admin
router.delete("/:id", authenticateJWT, isBarberOrAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user as { id: number; role: string };

    const existing = await prisma.availability.findUnique({
      where: { id: Number(id) },
      include: { barber: true },
    });

    if (!existing) {
      return res.status(404).json({ error: "Availability not found" });
    }

    if (user.role === "BARBER") {
      const barber = await prisma.barber.findUnique({ where: { userId: user.id } });
      if (!barber || barber.id !== existing.barberId) {
        return res.status(403).json({ error: "Cannot delete another barber's availability" });
      }
    }

    await prisma.availability.delete({ where: { id: Number(id) } });
    res.json({ message: "Availability deleted" });
  } catch (error) {
    console.error("Error deleting availability:", error);
    res.status(500).json({ error: "Error deleting availability" });
  }
});

export default router;