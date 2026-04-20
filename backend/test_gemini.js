require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testGemini() {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      systemInstruction: "You are a fitness coach."
    });

    const chatSession = model.startChat({
      history: [
        { role: "user", parts: [{ text: "Hello" }] },
        { role: "model", parts: [{ text: "Hi! How can I help you train today?" }] }
      ]
    });

    const result = await chatSession.sendMessage("What is my name?");
    console.log("SUCCESS:", result.response.text());
  } catch (error) {
    console.error("ERROR 1:");
    console.log(JSON.stringify(error, null, 2));

    try {
      const model2 = genAI.getGenerativeModel({  model: "gemini-2.0-flash"  });
      const chat2 = model2.startChat({ systemInstruction: "You are a fitness coach." });
      await chat2.sendMessage("Hello");
      console.log("SUCCESS 2");
    } catch(err2) {
      console.error("ERROR 2:", JSON.stringify(err2, null, 2));
    }
  }
}

testGemini();
