import express from "express";
import cors from "cors";
import ozowRouter from "./ozow.js";

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

app.use("/api/ozow", ozowRouter);

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Ozow server running on port ${PORT}`);
});

