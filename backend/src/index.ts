import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import serviceRoutes from "./routes/services";
import userRoutes from "./routes/users";
import googleOAuthRoutes from "./routes/googleOAuthRoutes";
import availabilityRoutes from "./routes/availability";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use("/services", serviceRoutes);
app.use("/users", userRoutes);
app.use("/api/auth", googleOAuthRoutes);
app.use("/availability", availabilityRoutes);

app.get("/", (_req, res) => {
  res.send("Barber Appointments API is running 🚀");
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
