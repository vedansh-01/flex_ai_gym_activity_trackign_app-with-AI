require('dotenv').config();

async function listAllModels() {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const data = await response.json();
    if(data.models) {
        console.log("AVAILABLE MODELS:");
        data.models.forEach(m => console.log(m.name, "-", m.version));
    } else {
        console.log("Error or no models format:", data);
    }
  } catch(e) {
    console.error("Fetch failed", e);
  }
}

listAllModels();
