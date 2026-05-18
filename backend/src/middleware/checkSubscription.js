const { supabase } = require('../config/supabase');

const checkSubscription = async (req, res, next) => {
  const userId = req.user.id;

  try {
    // Query active subscription where expires_at is greater than current time
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('expires_at, active')
      .eq('user_id', userId)
      .eq('active', true)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (error) {
      console.error('Error fetching subscription in middleware:', error);
      return res.status(500).json({ message: 'Internal security verification error' });
    }

    if (!subscription) {
      return res.status(403).json({
        code: 'SUBSCRIPTION_LOCKED',
        message: 'Your AI Coach subscription is inactive. Please activate a code to access AI features.'
      });
    }

    // Subscription is valid, proceed
    req.subscription = subscription;
    next();
  } catch (error) {
    console.error('Subscription middleware error:', error);
    res.status(500).json({ message: 'Security check failed' });
  }
};

module.exports = { checkSubscription };
