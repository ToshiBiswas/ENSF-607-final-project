const express = require("express");
const router = express.Router();
const { z } = require("zod");
const { getEventAdvice, getOutfitAdvice } = require("../services/gemini.service.cjs");

//Event planning advice 
router.post("/advice", async (req, res) => {
  try {
    const result = await getEventAdvice(req.body || {});
    return res.json({ ok: true, advice: result.text });
  } catch (err) {
    const status = err?.status || 500;
    const message =
      status === 503
        ? "Temporarily unavailable: the language model is busy. Please retry in a moment."
        : (err?.message || "Advice generation failed");
    return res.status(status).json({ ok: false, error: message });
  }
});

//Outfit advice 
const StyleSchema = z.object({
  eventTitle: z.string().min(1, "eventTitle is required"),
  date: z.string().optional(),
  location: z.string().optional(),
  formality: z.string().optional(),
  dressCode: z.string().optional(),
  weather: z.string().optional(),
  preferences: z.string().optional(),
  constraints: z.string().optional(),
});

router.post("/advice/style", async (req, res) => {
  try {
    const input = StyleSchema.parse(req.body || {});
    const result = await getOutfitAdvice(input);
    return res.json({ ok: true, ...result.json });
  } catch (err) {
    if (err?.issues) {
      return res.status(400).json({
        ok: false,
        error: "Invalid request body",
        details: err.issues.map(i => ({ path: i.path, message: i.message })),
      });
    }
    const status = err?.status || 500;
    const message =
      status === 503
        ? "Temporarily unavailable: the language model is busy. Please retry in a moment."
        : (err?.message || "Style advice failed");
    return res.status(status).json({ ok: false, error: message });
  }
});

module.exports = router;
