const { supabase } = require('../config/supabase');
const { OpenAI } = require('openai');

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:5000",
    "X-Title": "FlexAI Structured Generators",
  }
});

// Helper to fetch profile context
const getUserProfile = async (userId) => {
  const { data: user } = await supabase
    .from('users')
    .select('age, gender, height, weight')
    .eq('id', userId)
    .single();
  return user ? `${user.age}yr old ${user.gender || 'user'}, ${user.height}cm, ${user.weight}kg.` : 'unknown metrics';
};

// ─── 1. Workout Generator ──────────────────────────────────────────────────────
exports.generateWorkout = async (req, res) => {
  try {
    const { prompt } = req.body;
    const userId = req.user.id;

    if (!prompt) {
      return res.status(400).json({ message: 'Prompt is required' });
    }

    const userContext = await getUserProfile(userId);

    const systemPrompt = `You are a professional personal trainer.
Generate a structured workout plan based on the user's details and their request.
User Context: ${userContext}

CRITICAL RULES:
1. Return ONLY a valid JSON object. No explanation, no extra text, no markdown wrappers like \`\`\`json.
2. The JSON object must strictly match this schema:
{
  "workout_name": "Name of the workout",
  "duration": 45, // estimated duration in minutes
  "exercises": [
    {
      "exercise_name": "Exercise Name",
      "sets": 4,
      "reps": 10,
      "weight": 50 // weight in kg, use 0 for bodyweight
    }
  ]
}
`;

    const completion = await openai.chat.completions.create({
      model: "google/gemma-3-12b-it:free",
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ]
    });

    const aiText = completion.choices[0].message.content.trim();

    // Clean markdown wrappers if any
    const cleaned = aiText.replace(/^\`\`\`json\n?|\`\`\`$/g, '').trim();
    const workoutJson = JSON.parse(cleaned);

    res.json(workoutJson);

  } catch (error) {
    console.error("AI Workout Generation Error:", error);
    res.status(500).json({ message: 'AI failed to generate a structured workout. Please try again.' });
  }
};

// ─── 2. Meal Planner ──────────────────────────────────────────────────────────
exports.generateMealPlan = async (req, res) => {
  try {
    const { prompt } = req.body;
    const userId = req.user.id;

    if (!prompt) {
      return res.status(400).json({ message: 'Prompt is required' });
    }

    const userContext = await getUserProfile(userId);

    const systemPrompt = `You are a professional nutritionist.
Generate a structured meal plan based on the user's details and their request.
User Context: ${userContext}

CRITICAL RULES:
1. Return ONLY a valid JSON object. No explanation, no extra text, no markdown wrappers.
2. The JSON object must strictly match this schema:
{
  "meal_name": "Name of the meal",
  "calories": 450,
  "protein": 30, // in grams
  "carbs": 45, // in grams
  "fats": 12, // in grams
  "foods": [
    {
      "name": "Food Name",
      "quantity": 100, // numeric value
      "unit": "g" // e.g. g, ml, pcs, tbsp
    }
  ]
}
`;

    const completion = await openai.chat.completions.create({
      model: "google/gemma-3-12b-it:free",
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ]
    });

    const aiText = completion.choices[0].message.content.trim();

    // Clean markdown wrappers if any
    const cleaned = aiText.replace(/^\`\`\`json\n?|\`\`\`$/g, '').trim();
    const mealJson = JSON.parse(cleaned);

    res.json(mealJson);

  } catch (error) {
    console.error("AI Meal Generation Error:", error);
    res.status(500).json({ message: 'AI failed to generate a structured meal plan. Please try again.' });
  }
};
