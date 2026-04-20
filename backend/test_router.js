require('dotenv').config();
const { OpenAI } = require('openai');

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

async function testProvider() {
  try {
    console.log("Testing Llama 3.3 Free...");
    const c1 = await openai.chat.completions.create({
      model: "meta-llama/llama-3.3-70b-instruct:free",
      messages: [{ role: "user", content: "Hi" }]
    });
    console.log("Llama 3.3 SUCCESS:", c1.choices[0].message.content);
  } catch (error) {
    console.error("Llama 3.3 ERROR:", error.message);
  }

  try {
    console.log("\nTesting Gemini 2.0 Flash Lite Free (via OpenRouter)...");
    const c2 = await openai.chat.completions.create({
      model: "google/gemini-2.0-flash-lite-preview-02-05:free",
      messages: [{ role: "user", content: "Hi" }]
    });
    console.log("Gemini SUCCESS:", c2.choices[0].message.content);
  } catch (error) {
    console.error("Gemini ERROR:", error.message);
  }
}

testProvider();
