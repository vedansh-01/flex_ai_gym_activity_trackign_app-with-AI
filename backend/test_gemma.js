require('dotenv').config();
const { OpenAI } = require('openai');

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

async function testProvider() {
  try {
    const c1 = await openai.chat.completions.create({
      model: "google/gemma-3-12b-it:free",
      messages: [{ role: "user", content: "Hi" }]
    });
    console.log("Gemma SUCCESS:", c1.choices[0].message.content);
  } catch (error) {
    console.error("Gemma ERROR:", error.message);
  }
}

testProvider();
