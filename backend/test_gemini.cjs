//test made by chatgpt
require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

(async () => {
  try {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("Missing GEMINI_API_KEY in env");
    console.log("Key present:", /^AIza/.test(key) ? "looks valid" : "unexpected format");

    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const res = await model.generateContent("Reply with exactly: OK");
    console.log("SDK OK. Model replied:", res?.response?.text?.());
  } catch (e) {
    console.error("Standalone test failed:");
    console.error(" message:", e?.message || e);
    if (e?.status) console.error(" status:", e.status);
    if (e?.code) console.error(" code:", e.code);
    if (e?.response?.data) console.error(" data:", e.response.data);
    process.exit(1);
  }
})();
