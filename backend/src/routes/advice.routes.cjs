const express = require("express");
const router = express.Router();
const { z } = require("zod");

//existing services
const { getEventAdvice, getOutfitAdvice, getOutfitAdviceChat } = require("../services/gemini.service.cjs");
//new service
const { recommendEventFromDb } = require("../services/recommend.service.cjs");

//---------- existing routes ----------

//event planning advice
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

//outfit advice
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

//---------- new routes for your flow ----------

//1) ask the user first
router.get("/ask-event-type", (_req, res) => {
  return res.json({
    ok: true,
    question: "What type of events are you interested in? (e.g., workshops, concerts, hackathons)"
  });
});

//2) recommend one event from db via gemini (non-streaming)
const RecommendSchema = z.object({
  eventType: z.string().min(1, "eventType is required")
});

router.post("/recommend-event", async (req, res) => {
  try {
    const { eventType } = RecommendSchema.parse(req.body || {});
    const payload = await recommendEventFromDb({ eventType });
    //payload is already strict json
    return res.json({ ok: true, ...payload });
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
        : (err?.message || "Event recommendation failed");
    return res.status(status).json({ ok: false, error: message });
  }
});

//chat/follow-up questions about outfit advice
const ChatSchema = z.object({
  eventTitle: z.string().min(1, "eventTitle is required"),
  date: z.string().optional(),
  location: z.string().optional(),
  question: z.string().min(1, "question is required"),
  originalAdvice: z.any().optional(),
  conversationHistory: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string(),
  })).optional(),
});

router.post("/advice/style/chat", async (req, res) => {
  try {
    const input = ChatSchema.parse(req.body || {});
    const result = await getOutfitAdviceChat(input);
    return res.json({ ok: true, response: result.text });
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
        : (err?.message || "Chat failed");
    return res.status(status).json({ ok: false, error: message });
  }
});

module.exports = router;
