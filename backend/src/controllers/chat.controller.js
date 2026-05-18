const { supabase } = require('../config/supabase');
const { OpenAI } = require('openai');

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:5000",
    "X-Title": "FlexAI Coach",
  }
});

const buildPrivacyFilteredContext = async (userId) => {
  try {
    // 1. Fetch User Profile
    const { data: user } = await supabase
      .from('users')
      .select('age, gender, height, weight')
      .eq('id', userId)
      .single();

    // 2. Fetch Recent Workouts
    const { data: workouts } = await supabase
      .from('workouts')
      .select('id, workout_name, duration, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(3);

    // Fetch exercises for those workouts
    let workoutsStr = '';
    if (workouts && workouts.length > 0) {
      for (const w of workouts) {
        const { data: exercises } = await supabase
          .from('exercise_logs')
          .select('exercise_name, sets, reps, weight')
          .eq('workout_id', w.id);
        
        const exStr = exercises?.map(ex => `  > ${ex.exercise_name}: ${ex.sets} sets x ${ex.reps} reps @ ${ex.weight}kg`).join('\n') || '  > No exercises logged.';
        workoutsStr += `- [${new Date(w.created_at).toISOString().split('T')[0]}] ${w.workout_name} (${w.duration || 0} min)\n${exStr}\n`;
      }
    }

    // 3. Fetch Today's Nutrition
    const today = new Date();
    today.setUTCHours(0,0,0,0);
    
    const { data: foods } = await supabase
      .from('food_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('logged_at', today.toISOString());

    let nutritionStr = 'No food logged today.';
    if (foods && foods.length > 0) {
      nutritionStr = foods.map(f => 
        `- ${f.food_name}: ${f.calories}kcal (P:${f.protein||0} C:${f.carbs||0} F:${f.fats||0})`
      ).join('\n');
    }

    // Combine
    return `
--- CONTEXT: ANONYMOUS USER METRICS ---
Profile: ${user?.age || '?'}yr old ${user?.gender || '?'}, ${user?.height || '?'}cm, ${user?.weight || '?'}kg.

Recent Workouts (Last 3): 
${workoutsStr || 'No recent workouts.'}

Today's Nutrition: 
${nutritionStr}
---------------------------------------
`;
  } catch (error) {
    console.error("Error building context:", error);
    return "--- NO CONTEXT AVAILABLE ---";
  }
};

const SYSTEM_PROMPT = `You are FlexAI, an elite, highly specialized personal trainer and nutritionist coach.
RULES:
1. You have access to the user's live metrics (provided in context below). Reference them to give hyper-personalized advice.
2. Keep responses CONCISE, friendly, and actionable (under 4-5 sentences). Avoid massive essays.
3. If asked about ANY topic outside of fitness, health, nutrition, or the app functions, POLITELY REFUSE. You are specialized.
4. Never mention that you are an AI model.
`;

exports.sendTextMessage = async (req, res) => {
  try {
    const { text } = req.body; 
    const userId = req.user.id;

    // 1. Get Context from Supabase
    const contextStr = await buildPrivacyFilteredContext(userId);

    // 2. Fetch recent chat history
    const { data: history } = await supabase
      .from('ai_recommendations')
      .select('prompt, response, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    // 3. Format messages
    const openAiMessages = [
      { role: 'system', content: SYSTEM_PROMPT + contextStr }
    ];

    if (history && history.length > 0) {
      // History comes back newest first, we need oldest first
      history.reverse().forEach(interaction => {
        openAiMessages.push({ role: 'user', content: interaction.prompt });
        openAiMessages.push({ role: 'assistant', content: interaction.response });
      });
    }
    
    openAiMessages.push({ role: 'user', content: text });

    // 4. Call Gemma 3 12B on OpenRouter
    const completion = await openai.chat.completions.create({
      model: "google/gemma-3-12b-it:free",
      messages: openAiMessages
    });

    const aiTextContent = completion.choices[0].message.content;

    // 5. Save interaction to Supabase DB
    await supabase.from('ai_recommendations').insert([{
      user_id: userId,
      prompt: text,
      response: aiTextContent
    }]);

    // 6. Return response
    res.json({
       role: 'assistant',
       content: aiTextContent,
       timestamp: new Date()
    });

  } catch (error) {
    console.error("Text Chat Error:", error);
    res.status(500).json({ message: error.message || 'Coach failed to respond' });
  }
};
