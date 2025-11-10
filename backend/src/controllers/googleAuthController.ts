// import { Request, Response } from "express";
// import { OAuth2Client } from "google-auth-library";
// import { PrismaClient, Role } from "@prisma/client";
// import jwt from "jsonwebtoken";

// const prisma = new PrismaClient();
// const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// export const googleAuth = async (req: Request, res: Response) => {
//   try {
//     const { token } = req.body;

//     if (!token) {
//       return res.status(400).json({ message: "Missing Google token" });
//     }

//     // Verify the token with Google
//     const ticket = await client.verifyIdToken({
//       idToken: token,
//       audience: process.env.GOOGLE_CLIENT_ID,
//     });

//     const payload = ticket.getPayload();

//     if (!payload || !payload.email) {
//       return res.status(400).json({ message: "Invalid Google token" });
//     }

//     const { email, name } = payload;

//     // Search for existing user
//     let user = await prisma.user.findUnique({ where: { email } });

//     // If user doesn't exist, create a new one
//     if (!user) {
//       user = await prisma.user.create({
//         data: {
//           email,
//           name: name || "Unnamed",
//           role: Role.CLIENT,
//           // No password for Google-authenticated users
//           password: null,
//         },
//       });
//     }

//     // Create JWT
//     const jwtToken = jwt.sign(
//       { id: user.id, role: user.role },
//       process.env.JWT_SECRET!,
//       { expiresIn: "7d" }
//     );

//     // Send response
//     return res.status(200).json({
//       message: "Google authentication successful",
//       token: jwtToken,
//       user,
//     });
//   } catch (error) {
//     console.error("Google Auth Error:", error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };
