require('dotenv').config();
const { OpenAI } = require('openai');

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:5000",
    "X-Title": "FlexAI Coach",
  }
});

async function testOpenRouter() {
  try {
    const completion = await openai.chat.completions.create({
      model: "meta-llama/llama-3-8b-instruct:free",
      messages: [{ role: "user", content: "Hello, OpenRouter!" }],
      max_tokens: 250,
      temperature: 0.7,
    });
    console.log("SUCCESS:", completion.choices[0].message.content);
  } catch (error) {
    console.error("ERROR:");
    console.error("Message:", error.message);
    if(error.response) console.error("Data:", error.response.data);
  }
}

testOpenRouter();
