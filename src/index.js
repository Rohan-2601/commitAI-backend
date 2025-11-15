import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import mongoose from "mongoose";
import pino from "pino";
import authRoutes from "./routes/auth.js";
import generateRoute from "./routes/generate.js";
import { authMiddleware } from "./middleware/auth.js";
import { rateLimitUser } from "./middleware/rateLimitUser.js";


dotenv.config();
const logger = pino({ level: "info" });

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "200kb" }));

// Connect DB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => logger.info("MongoDB connected"))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

// Routes
app.use("/api/auth", authRoutes);


// Protected AI route
app.use("/api/generate", authMiddleware, rateLimitUser, generateRoute);

app.get("/", (req, res) => {
  res.json({ status: "CommitAI API running" });
});

app.listen(process.env.PORT || 4000, () =>
  logger.info(`Server running on port ${process.env.PORT || 4000}`)
);


