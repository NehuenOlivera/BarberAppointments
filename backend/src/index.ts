import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import serviceRoutes from "./routes/services";
import userRoutes from "./routes/users";
import googleOAuthRoutes from "./routes/googleOAuthRoutes";
//import { PrismaClient } from "@prisma/client";

dotenv.config();
const app = express();
//const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());
app.use("/services", serviceRoutes);
app.use("/users", userRoutes);
app.use("/api/auth", googleOAuthRoutes);

app.get("/", (_req, res) => {
  res.send("Barber Appointments API is running 🚀");
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
