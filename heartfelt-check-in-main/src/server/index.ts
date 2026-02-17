import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import paypalRouter from "./paypal.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const isProduction = process.env.NODE_ENV === "production";
const PORT = parseInt(process.env.PORT || "5000", 10);

app.use(cors());

app.use(express.json());

app.use("/api/paypal", paypalRouter);

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

if (isProduction) {
  const distPath = path.resolve(__dirname, "../../dist");

  app.use(express.static(distPath));

  app.use((req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
