import express, { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import { PrismaClient, Role } from "@prisma/client";
import jwt from "jsonwebtoken";

const router = express.Router();
const prisma = new PrismaClient();

const client = new OAuth2Client({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_REDIRECT_URI,
});

// GET /api/auth/google?code=XYZ
router.get("/google", async (req: Request, res: Response) => {
  const code = req.query.code as string;

  if (!code) {
    return res.status(400).json({ message: "Missing authorization code" });
  }

  try {
    // Exchange the authorization code for tokens
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    // Verify the ID token to get user info
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).json({ message: "Invalid Google token" });
    }

    const { email, name } = payload;

    // Find or create user
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: name || "Unnamed",
          role: Role.CLIENT,
          password: "", // empty string since password is required
        },
      });
    }

    // Create JWT
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      message: "Google authentication successful",
      token,
      user,
    });
  } catch (error) {
    console.error("Google OAuth error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;
