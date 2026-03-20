import express from "express";
import cors from "cors";
import { env } from "./config/env";
import authRoutes from "./routes/authRoutes";
import submissionRoutes from "./routes/submissionRoutes";
import resultRoutes from "./routes/resultRoutes";
import { errorMiddleware } from "./middleware/errorMiddleware";

export const app = express();

app.use(
  cors({
    origin: env.CLIENT_URL
  })
);
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/results", resultRoutes);

app.use(errorMiddleware);
