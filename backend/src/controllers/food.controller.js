const Food = require('../models/Food');

/**
 * @desc    Search for foods by name
 * @route   GET /api/foods/search
 * @access  Private (or Public, but typically Private)
 */
exports.searchFoods = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(200).json([]);
    }

    // Use text index for search, or falling back to regex if needed
    // The model has a text index on 'name'
    const foods = await Food.find(
      { $text: { $search: q } },
      { score: { $meta: 'textScore' } }
    )
    .sort({ score: { $meta: 'textScore' } })
    .limit(20);

    // If text search returns nothing (e.g. partial matches), try regex
    if (foods.length === 0) {
      const regexFoods = await Food.find({
        name: { $regex: q, $options: 'i' }
      }).limit(20);
      return res.status(200).json(regexFoods);
    }

    res.status(200).json(foods);
  } catch (error) {
    console.error('Error searching foods:', error);
    res.status(500).json({ message: 'Error searching foods' });
  }
};
