import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import ozowRouter from "./ozow.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const isProduction = process.env.NODE_ENV === "production";
const PORT = parseInt(process.env.PORT || (isProduction ? "5000" : "4000"), 10);

app.use(cors());
app.use(express.json());

app.use("/api/ozow", ozowRouter);

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

if (isProduction) {
  const distPath = path.join(__dirname, "../../dist");
  app.use(express.static(distPath));
  
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT} (${isProduction ? "production" : "development"})`);
});

