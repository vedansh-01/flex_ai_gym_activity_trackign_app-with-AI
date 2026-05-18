const { supabase } = require('../config/supabase');

// ─── 1. Check Subscription Status ──────────────────────────────────────────────
exports.getStatus = async (req, res) => {
  const userId = req.user.id;

  try {
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('expires_at, active')
      .eq('user_id', userId)
      .eq('active', true)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (error) throw error;

    if (!subscription) {
      return res.json({ active: false, expires_at: null });
    }

    res.json({ active: true, expires_at: subscription.expires_at });
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    res.status(500).json({ message: 'Failed to retrieve subscription status' });
  }
};

// ─── 2. Activate Premium Code ──────────────────────────────────────────────────
exports.activateCode = async (req, res) => {
  const { code } = req.body;
  const userId = req.user.id;

  if (!code) {
    return res.status(400).json({ message: 'Activation code is required' });
  }

  try {
    // 1. Verify if code is valid in activation_codes table
    const { data: codeData, error: codeErr } = await supabase
      .from('activation_codes')
      .select('duration_months')
      .eq('code', code)
      .maybeSingle();

    if (codeErr || !codeData) {
      return res.status(400).json({ message: 'Invalid activation code' });
    }

    // 2. Check if this specific user has already activated this specific code
    const { data: existingActivation, error: actErr } = await supabase
      .from('user_activations')
      .select('id')
      .eq('user_id', userId)
      .eq('code', code)
      .maybeSingle();

    if (existingActivation) {
      return res.status(400).json({ message: 'You have already activated this code!' });
    }

    // 3. Register the code activation for this user
    const { error: insertActErr } = await supabase
      .from('user_activations')
      .insert([{ user_id: userId, code }]);

    if (insertActErr) {
      console.error('Error registering code usage:', insertActErr);
      return res.status(500).json({ message: 'Failed to apply code' });
    }

    // 4. Fetch user's current active subscription (if any) to extend it
    const { data: currentSub } = await supabase
      .from('subscriptions')
      .select('expires_at')
      .eq('user_id', userId)
      .eq('active', true)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    let newExpiryDate = new Date();
    if (currentSub && currentSub.expires_at) {
      newExpiryDate = new Date(currentSub.expires_at);
    }
    
    // Add duration in months
    newExpiryDate.setMonth(newExpiryDate.getMonth() + codeData.duration_months);

    // 5. Update or insert new subscription details
    const { error: upsertErr } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        plan: `Premium (${codeData.duration_months} Month${codeData.duration_months > 1 ? 's' : ''})`,
        active: true,
        expires_at: newExpiryDate.toISOString()
      }, { onConflict: 'user_id' }); // Supposing 'user_id' is unique in subscriptions, or let's use standard insert/update logic

    if (upsertErr) {
      console.error('Subscription update failed:', upsertErr);
      return res.status(500).json({ message: 'Failed to update subscription' });
    }

    res.json({
      message: `Premium unlocked for ${codeData.duration_months} month${codeData.duration_months > 1 ? 's' : ''}!`,
      expires_at: newExpiryDate.toISOString()
    });

  } catch (error) {
    console.error('Activation transaction error:', error);
    res.status(500).json({ message: 'Server error processing code activation' });
  }
};
