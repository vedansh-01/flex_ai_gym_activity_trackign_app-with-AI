const WaterLog = require('../models/WaterLog');

// ─── GET /api/water/today ───────────────────────────────────────────────────
// Get all water entries for today and the sum
const getTodayWater = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const logs = await WaterLog.find({
      user: req.user.id,
      date: { $gte: today }
    }).sort({ date: -1 });

    const total = logs.reduce((sum, log) => sum + log.amount, 0);

    res.json({ logs, total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── POST /api/water ────────────────────────────────────────────────────────
// Add a new water entry
const addWater = async (req, res) => {
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ message: 'Valid water amount is required' });
  }

  try {
    const log = new WaterLog({
      user: req.user.id,
      amount: Number(amount),
      date: new Date()
    });

    const saved = await log.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── DELETE /api/water/:id ─────────────────────────────────────────────────
// Remove a water entry
const deleteWater = async (req, res) => {
  try {
    const log = await WaterLog.findOne({ _id: req.params.id, user: req.user.id });
    if (!log) return res.status(404).json({ message: 'Entry not found' });

    await log.deleteOne();
    res.json({ message: 'Entry deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getTodayWater, addWater, deleteWater };
