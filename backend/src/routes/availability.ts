import express, { Request, Response } from "express";
import { authenticateJWT } from "../moddleware/auth";
import { isBarberOrAdmin } from "../moddleware/roles";
import {
  createAvailability,
  updateAvailability,
  deleteAvailability,
  getAvailabilitiesByBarber,
} from "../controllers/availabilityController";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = express.Router();

// GET: todas las disponibilidades de todos los barberos (público)
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

// GET: todas las disponibilidades de un barbero (público)
router.get("/:barberId", async (req: Request, res: Response) => {
  try {
    const barberId = parseInt(req.params.barberId, 10);
    if (isNaN(barberId)) return res.status(400).json({ message: "Invalid barber ID" });

    const availabilities = await getAvailabilitiesByBarber(barberId);
    res.status(200).json(availabilities);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// POST: crear nueva disponibilidad
router.post("/", authenticateJWT, isBarberOrAdmin, async (req: Request, res: Response) => {
  try {
    const availabilities = req.body; // Esperamos un array de objetos
    if (!Array.isArray(availabilities) || availabilities.length === 0) {
      return res.status(400).json({ message: "Provide an array of availabilities" });
    }

    const results: { created: any[]; failed: { item: any; reason: string }[] } = {
      created: [],
      failed: [],
    };

    for (const item of availabilities) {
      const { barberId, weekday, startHour, endHour } = item;

      if (!barberId || weekday === undefined || !startHour || !endHour) {
        results.failed.push({ item, reason: "Missing required fields" });
        continue;
      }

      if (startHour >= endHour) {
        results.failed.push({ item, reason: "startHour must be before endHour" });
        continue;
      }

      try {
        const created = await createAvailability(barberId, weekday, startHour, endHour);
        results.created.push(created);
      } catch (error: any) {
        results.failed.push({ item, reason: error.message });
      }
    }

    res.status(201).json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// PUT: actualizar disponibilidad existente
router.put("/:id", authenticateJWT, isBarberOrAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { startHour, endHour, weekday } = req.body;

    if (isNaN(id) || !startHour || !endHour || weekday === undefined) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (startHour >= endHour) return res.status(400).json({ message: "startHour must be before endHour" });

    const updated = await updateAvailability(id, startHour, endHour, weekday);
    res.status(200).json(updated);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE: eliminar disponibilidad
router.delete("/:id", authenticateJWT, isBarberOrAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid availability ID" });

    await deleteAvailability(id);
    res.status(200).json({ message: "Availability deleted" });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;