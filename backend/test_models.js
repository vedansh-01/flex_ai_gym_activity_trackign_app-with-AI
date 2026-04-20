require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
  try {
    // Quick test to see if standard 1.5 flash works directly
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("hello");
    console.log("TEST 1.5 SUCCESS:", result.response.text());
  } catch(e) {
    console.error("TEST 1.5 FAILED:", e.status, e.statusText);
  }

  try {
    // Test 1.5 pro
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    const result = await model.generateContent("hello");
    console.log("TEST PRO SUCCESS:", result.response.text());
  } catch(e) {
    console.error("TEST PRO FAILED:", e.status, e.statusText);
  }
}

listModels();
