const { GoogleGenerativeAI } = require('@google/generative-ai');

// Hardcoded specifically to verify if the string itself is banned
const newKey = "AIzaSyBgt_7bVDf7Zy0cFUvcjqJLwxytnboJG3c";
const genAI = new GoogleGenerativeAI(newKey);

async function testGemini() {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-lite",
    });

    const chatSession = model.startChat({
      history: [
        { role: "user", parts: [{ text: "Hello" }] },
      ]
    });

    const result = await chatSession.sendMessage("What is my name?");
    console.log("SUCCESS:", result.response.text());
  } catch (error) {
    if (error.status === 429) {
       console.log("FAIL: 429 TOO MANY REQUESTS.");
       console.log("This key is rate-limited out-of-the-box by Google.");
    } else {
       console.log(error);
    }
  }
}

testGemini();
