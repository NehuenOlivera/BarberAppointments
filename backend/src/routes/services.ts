import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

// Create new service
router.post("/", async (req, res) => {
  try {
    const { name, description, duration, price } = req.body;

    if (!name || !description || !price || !duration) {
      return res.status(400).json({ error: "Fill in all required fields" });
    }

    const service = await prisma.service.create({
      data: {
        name,
        description,
        duration: parseInt(duration),
        price: parseFloat(price),
      },
    });

    res.status(201).json(service);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error creating the service" });
  }
});

// Get all services
router.get("/", async (_req, res) => {
  try {
    const services = await prisma.service.findMany();
    res.json(services);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error getting services" });
  }
});

// Get single service by id
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const service = await prisma.service.findUnique({
      where: { id: parseInt(id) },
    });

    if (!service) {
      return res.status(404).json({ error: "Service not found" });
    }

    res.json(service);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error getting the service" });
  }
});

// Update service
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, duration, price, isActive } = req.body;

    const service = await prisma.service.update({
      where: { id: parseInt(id) },
      data: {
        name,
        description,
        duration: duration ? parseInt(duration) : undefined,
        price: price ? parseFloat(price) : undefined,
        isActive,
      },
    });

    res.json(service);
  } catch (error: any) {
    console.error(error);
    if (error.code === "P2025") {
      // Prisma error cuando no encuentra el registro
      return res.status(404).json({ error: "Service not found" });
    }
    res.status(500).json({ error: "Error updating the service" });
  }
});

// Delete service
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.service.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: "Service deleted successfully" });
  } catch (error: any) {
    console.error(error);
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Service not found" });
    }
    res.status(500).json({ error: "Error deleting the service" });
  }
});

export default router;
