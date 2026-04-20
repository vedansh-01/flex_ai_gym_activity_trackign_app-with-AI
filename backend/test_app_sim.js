require('dotenv').config();
const { OpenAI } = require('openai');

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

async function testAppSim() {
  try {
    const openAiMessages = [
      { role: 'system', content: "You are a test." },
      { role: 'user', content: "Hello" }
    ];
    
    console.log("Simulating controller request...");
    const completion = await openai.chat.completions.create({
      model: "google/gemma-3-12b-it:free",
      messages: openAiMessages,
      max_tokens: 250,
      temperature: 0.7,
    });
    console.log("SUCCESS:", completion.choices[0].message.content);
  } catch (error) {
    if(error.response) {
       console.log("HTTP CODE:", error.response.status);
       console.log("Raw Response:");
       console.log(error.response.data);
    }
    console.error("ERROR:", error.message);
  }
}

testAppSim();
