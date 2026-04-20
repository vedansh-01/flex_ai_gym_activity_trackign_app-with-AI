const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: "no-key-needed",
  baseURL: "https://text.pollinations.ai/openai"
});

async function testFree() {
  try {
    const c1 = await openai.chat.completions.create({
      model: "mistral",
      messages: [{ role: "user", content: "Hi! Who are you?" }]
    });
    console.log("POLLINATIONS SUCCESS:", c1.choices[0].message.content);
  } catch (error) {
    console.error("POLLINATIONS ERROR:", error);
  }
}

testFree();
