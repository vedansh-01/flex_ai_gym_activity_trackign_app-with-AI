const Chat = require('../models/Chat');
const User = require('../models/User');
const Workout = require('../models/Workout');
const Meal = require('../models/Meal');
const WaterLog = require('../models/WaterLog');
const { OpenAI } = require('openai');

const openai = new OpenAI({
  baseURL: "https://text.pollinations.ai/openai",
  apiKey: "no-key-needed"
});

// Helpers

// Fetches all relevant context without exposing PII (Name, Email, etc.)
const buildPrivacyFilteredContext = async (userId) => {
  const user = await User.findById(userId).select('age gender height weight activityLevel goal');
  
  // Last 3 workouts
  const workouts = await Workout.find({ user: userId })
    .sort({ date: -1 })
    .limit(3)
    .select('name date totalCaloriesBurned exercises');

  // Today's nutrition
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const meals = await Meal.find({ user: userId, date: { $gte: today } })
    .select('name totalCalories macros foods');

  // Today's water
  const waterLog = await WaterLog.findOne({ user: userId, date: { $gte: today } })
    .select('consumedML goalML');

  return `
--- CONTEXT: ANONYMOUS USER METRICS ---
Profile: ${user.age}yr old ${user.gender}, ${user.height}cm, ${user.weight}kg. Goal: ${user.goal}. Activity: ${user.activityLevel}.

Recent Workouts (Last 3): 
${workouts.map(w => {
  const exercisesText = w.exercises.map(ex => 
    `  > ${ex.name}: ` + ex.sets.map(s => `${s.reps}x${s.weight}kg`).join(', ')
  ).join('\n');
  return `- [${w.date.toISOString().split('T')[0]}] ${w.name} (${Math.round(w.totalCaloriesBurned||0)}kcal)\n${exercisesText}`;
}).join('\n')}

Today's Meals: 
${meals.map(m => {
  const foodsText = m.foods.map(f => 
    `  > ${f.name} (${f.quantity}${f.unit || 'g'}) - ${Math.round(f.calories)}kcal (P:${Math.round(f.protein||0)} C:${Math.round(f.carbs||0)} F:${Math.round(f.fats||0)})`
  ).join('\n');
  const mPro = m.macros?.protein || 0;
  const mCar = m.macros?.carbs || 0;
  const mFat = m.macros?.fats || 0;
  return `- ${m.name}: ${Math.round(m.totalCalories)}kcal Total (P:${Math.round(mPro)} C:${Math.round(mCar)} F:${Math.round(mFat)})\n${foodsText}`;
}).join('\n')}

Today's Water: ${waterLog ? waterLog.consumedML : 0}mL / ${waterLog ? waterLog.goalML : '0'}mL.
---------------------------------------
`;
};

const SYSTEM_PROMPT = `You are FlexAI, an elite, highly specialized personal trainer and nutritionist coach.
RULES:
1. You have access to the user's live metrics (provided in context below). Reference them to give hyper-personalized advice.
2. Keep responses CONCISE, friendly, and actionable (under 4-5 sentences). Avoid massive essays.
3. If asked about ANY topic outside of fitness, health, nutrition, or the app functions, POLITELY REFUSE. You are specialized.
4. Never mention that you are an AI model.
`;

// ─── Controller Methods ────────────────────────────────────────────────────────

exports.getHistory = async (req, res) => {
  try {
    let chat = await Chat.findOne({ user: req.user._id });
    if (!chat) {
      chat = await Chat.create({ user: req.user._id, messages: [] });
    }
    res.json(chat.messages);
  } catch (error) {
    res.status(500).json({ message: 'Server error retrieving history' });
  }
};

exports.sendTextMessage = async (req, res) => {
  try {
    const { text } = req.body; 
    
    // 1. Get Context
    const contextStr = await buildPrivacyFilteredContext(req.user._id);

    // 2. Fetch history
    let chat = await Chat.findOne({ user: req.user._id });
    if (!chat) chat = await Chat.create({ user: req.user._id, messages: [] });

    // Format for OpenRouter API (Same as OpenAI: user, assistant, system)
    const openAiMessages = [
      { role: 'system', content: SYSTEM_PROMPT + contextStr },
      ...chat.messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: text }
    ];

    // 3. Call Pollinations Free API (Bypass All Rate Limits)
    const completion = await openai.chat.completions.create({
      model: "openai-fast",
      messages: openAiMessages
    });

    const aiTextContent = completion.choices[0].message.content;

    // 4. Save to DB
    chat.messages.push({ role: 'user', content: text });
    chat.messages.push({ role: 'assistant', content: aiTextContent });
    await chat.save();

    // 5. Return response
    res.json({
       role: 'assistant',
       content: aiTextContent,
       timestamp: new Date()
    });

  } catch (error) {
    console.error("Text Chat Error (OpenRouter):", error);
    res.status(500).json({ message: error.message || 'Coach failed to respond' });
  }
};
