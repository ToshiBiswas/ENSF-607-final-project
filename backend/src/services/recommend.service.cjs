'use strict';

const { EventRepo } = require('../repositories/EventRepo');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { z } = require('zod');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const RecommendedSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string(),
  category: z.string(),
  date: z.string(),
  location: z.string(),
  reason: z.string(),
});

/**
 * Fetch events by category/name, ask Gemini to pick one, return strict JSON.
 * @param {{ eventType: string }} param0
 */
async function recommendEventFromDb({ eventType }) {
  // Pull candidates from DB
  const events = await EventRepo.findByCategoryOrTitle(eventType);

  if (!Array.isArray(events) || events.length === 0) {
    return { recommended_event: null, note: 'No events found for that type right now.' };
  }

  // Prepare prompt
  const list = events.map((e, idx) => ({
    id: e.eventId,
    name: e.title,
    category: (e.categories && e.categories[0]?.value) || 'General',
    date: e.startTime ? new Date(e.startTime).toISOString().slice(0, 10) : 'TBD',
    location: e.location || 'TBD',
    description: e.description || '',
  }));

  const instructions = `
You are an event recommender. Given a user interest "${eventType}" and a list of events,
pick the single best match and return strict JSON ONLY in this shape:
{
  "recommended_event": {
    "id": "...",
    "name": "...",
    "category": "...",
    "date": "YYYY-MM-DD",
    "location": "...",
    "reason": "short reason"
  }
}
If nothing fits, return {"recommended_event": null, "note": "short note"}.
Do not include any other text.

Events:
${JSON.stringify(list, null, 2)}
`;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(instructions);
    const text = result?.response?.text?.() || '{}';

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (_) {
      return { recommended_event: null, note: 'Could not parse AI response.' };
    }

    // Validate shape
    const rec = parsed?.recommended_event ?? null;
    if (rec === null) {
      return { recommended_event: null, note: parsed?.note || 'No matching event.' };
    }
    const safe = RecommendedSchema.safeParse(rec);
    if (!safe.success) {
      return { recommended_event: null, note: 'AI response missing fields.' };
    }

    return { recommended_event: safe.data };
  } catch (err) {
    // Fallback: pick first event locally if AI call fails
    const first = list[0];
    return {
      recommended_event: first
        ? {
            id: first.id,
            name: first.name,
            category: first.category,
            date: first.date,
            location: first.location,
            reason: 'Closest match from local events (AI unavailable).',
          }
        : null,
      note: first ? undefined : 'AI unavailable and no events found.',
      error: err?.message,
    };
  }
}

module.exports = { recommendEventFromDb };
