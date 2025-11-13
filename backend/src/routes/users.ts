import express from "express";
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { authenticateJWT, isAdmin } from "../moddleware/auth";

const router = express.Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || "Youjfjmkv159753"; // Store this in .env in production
const SALT_ROUNDS = 10;

// Register user (rol CLIENT)
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Fill all required fields" });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: Role.CLIENT,
      },
    });

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error registering user" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Fill all required fields" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    if (!user.password) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error logging in" });
  }
});

// Create barber user
router.post("/register-barber", authenticateJWT, isAdmin, async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: "Fill all required fields" });
        }

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: "Email already registered" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        // Create user with BARBER role
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: Role.BARBER,
            },
        });

        // Create barber profile
        const barber = await prisma.barber.create({
            data: {
                userId: user.id,
                isActive: true,
            }
        });

        const { password: _, ...userWithoutPassword } = user;
        res.status(201).json({ user: userWithoutPassword, barber });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error registering barber user" });
    }
});

// Get single barber by id
router.get("/barber/:id", authenticateJWT, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const barber = await prisma.barber.findUnique({
      where: { id: parseInt(id) }
    });
    if (!barber) {
      return res.status(404).json({ error: "Barber not found" });
    }
    res.json(barber);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error getting barber" });
  }
});

// Get all barbers
router.get("/barbers", authenticateJWT, isAdmin, async (_req, res) => {
  try {
    const barbers = await prisma.barber.findMany();
    res.json(barbers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error getting barbers" });
  }
});

export default router;
