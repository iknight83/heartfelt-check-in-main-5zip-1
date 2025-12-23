import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import ozowRouter from "./ozow.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const isProduction = process.env.NODE_ENV === "production";
const PORT = parseInt(process.env.PORT || "5000", 10);

// Middleware
app.use(cors());
app.use(express.json());

// API routes
app.use("/api/ozow", ozowRouter);

// Health check
app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// Serve frontend in production
if (isProduction) {
  const distPath = path.resolve(__dirname, "../../dist");

  app.use(express.static(distPath));

  // ✅ SAFE catch-all (NO path pattern)
  app.use((req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
