import express from "express";
import cors from "cors";
import ozowRouter from "./server/ozow";

const app = express();
const PORT = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// routes
app.use("/api/ozow", ozowRouter);

// health check
app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// start server
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});

