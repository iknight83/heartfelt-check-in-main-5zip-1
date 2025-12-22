import express from "express";

const router = express.Router();

router.post("/initiate", async (req, res) => {
  return res.json({
    status: "ok",
    message: "Ozow initiate placeholder"
  });
});

router.post("/notify", (req, res) => {
  console.log("Ozow callback received:", req.body);
  res.sendStatus(200);
});

export default router;

