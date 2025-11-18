const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) throw new Error("GEMINI_API_KEY is missing in .env");

const DEFAULT_CANDIDATES = [
  //loop through different gemini as some of them dont work
  "gemini-2.5-flash",
  "gemini-flash-latest",
  "gemini-2.0-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash-lite-001",
  "gemini-pro-latest",
  "gemini-2.5-pro",
];

//override from .env: 
const MODEL_CANDIDATES = (process.env.GEMINI_MODELS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const CANDIDATES = MODEL_CANDIDATES.length ? MODEL_CANDIDATES : DEFAULT_CANDIDATES;

const genAI = new GoogleGenerativeAI(API_KEY);

//behavior of gemini
const SYSTEM_INSTRUCTION = {
  text:
    "You are a concise, pragmatic event-planning advisor. Give scoped, budget-aware, concrete suggestions.",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function withRetry(fn, { tries = 6, baseMs = 600 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt < tries; attempt++) {
    try {
      return await fn(attempt);
    } catch (err) {
      lastErr = err;
      const status = err?.status || err?.statusCode;
      const retryable =
        [429, 502, 503, 504].includes(status) || err?.message === "Empty model response";
      if (!retryable || attempt === tries - 1) break;
      const backoff = baseMs * 2 ** attempt + Math.floor(Math.random() * 400);
      console.warn(
        `Retrying after ${backoff}ms (attempt ${attempt + 1}/${tries}) due to ${
          status || err.message
        }...`
      );
      await sleep(backoff);
    }
  }
  throw lastErr;
}

async function callOnce(modelId, userPrompt) {
  const model = genAI.getGenerativeModel({
    model: modelId,
    systemInstruction: SYSTEM_INSTRUCTION,
  });

  const res = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    generationConfig: {
      temperature: 0.6,
      maxOutputTokens: 250,
      responseMimeType: "text/plain",
    },
  });

  const text = res?.response?.text?.();
  if (!text) {
    const e = new Error("Empty model response");
    e.status = 503;
    throw e;
  }
  return text;
}

async function callOnceJson(modelId, userPrompt) {
  const model = genAI.getGenerativeModel({
    model: modelId,
    systemInstruction: SYSTEM_INSTRUCTION,
  });

  const res = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    generationConfig: {
      temperature: 0.6,
      maxOutputTokens: 350,
      responseMimeType: "application/json",
    },
  });

  const txt = res?.response?.text?.();
  if (!txt) {
    const e = new Error("Empty model response");
    e.status = 503;
    throw e;
  }

  try {
    return JSON.parse(txt);
  } catch {
    const e = new Error("Model returned non-JSON content");
    e.status = 502; //retry next model
    throw e;
  }
}

//Event advice 
async function getEventAdvice(event) {
  const userPrompt = `
Event:
- Title: ${event.title ?? "N/A"}
- Date: ${event.date ?? "N/A"}
- Attendees: ${event.attendees ?? "N/A"}
- Budget: ${event.budget ?? "N/A"}
- Location: ${event.location ?? "N/A"}
- Goals: ${event.goals ?? "N/A"}
- Constraints: ${event.constraints ?? "N/A"}

Instructions:
- Provide 4–7 actionable recommendations.
- Mention key risks and mitigations when relevant.
- Keep the response tight and organized with short bullets.
`.trim();

  let lastErr;
  for (const modelId of CANDIDATES) {
    try {
      console.log(`[Gemini] Trying model: ${modelId}`);
      const text = await withRetry(() => callOnce(modelId, userPrompt), {
        tries: 6,
        baseMs: 700,
      });
      return { text };
    } catch (err) {
      lastErr = err;
      const status = err?.status || err?.statusCode;
      console.warn(
        `[Gemini] Model ${modelId} failed with ${status || err.message}. Trying next model...`
      );
    }
  }

  const status = lastErr?.status || lastErr?.statusCode || 500;
  const message =
    status === 503
      ? "Temporarily unavailable: the language model is busy. Please retry in a moment."
      : lastErr?.message || "Unknown Gemini error";
  const e = new Error(message);
  e.status = status;
  throw e;
}

//Outfit Style advice 
async function getOutfitAdvice(input) {
  const userPrompt = `
Event:
- Title: ${input.eventTitle ?? "N/A"}
- Date: ${input.date ?? "N/A"}
- Location: ${input.location ?? "N/A"}
- Formality: ${input.formality ?? "unspecified"}
- Dress code: ${input.dressCode ?? "unspecified"}
- Weather: ${input.weather ?? "unspecified"}
- Preferences: ${input.preferences ?? "none"}
- Constraints: ${input.constraints ?? "none"}

Return ONLY JSON with this shape:
{
  "summary": "1-2 sentences setting the vibe",
  "outfits": [
    {
      "label": "short name",
      "items": ["item 1", "item 2", "item 3"],
      "accessories": ["acc 1", "acc 2"],
      "notes": "fit-specific considerations",
      "estimatedCost": "CAD $xx–$yy"
    }
  ],
  "dos": ["do 1","do 2","do 3"],
  "donts": ["dont 1","dont 2"],
  "shoppingList": ["priority item 1","priority item 2"]
}
- Keep items concise and practical.
- Consider formality, venue, weather, preferences, and constraints.
- If dress code and formality conflict, follow the stricter one.
`.trim();

  let lastErr;
  for (const modelId of CANDIDATES) {
    try {
      console.log(`[Gemini] (style) Trying model: ${modelId}`);
      const json = await withRetry(() => callOnceJson(modelId, userPrompt), {
        tries: 6,
        baseMs: 700,
      });
      return { json }; 
    } catch (err) {
      lastErr = err;
      const status = err?.status || err?.statusCode;
      console.warn(
        `[Gemini] (style) Model ${modelId} failed with ${status || err.message}. Trying next...`
      );
    }
  }

  const status = lastErr?.status || lastErr?.statusCode || 500;
  const message =
    status === 503
      ? "Temporarily unavailable: the language model is busy. Please retry in a moment."
      : lastErr?.message || "Unknown Gemini error";
  const e = new Error(message);
  e.status = status;
  throw e;
}

module.exports = { getEventAdvice, getOutfitAdvice };
