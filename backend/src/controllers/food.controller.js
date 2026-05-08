const Food = require('../models/Food');

/**
 * @desc    Search for foods by name
 * @route   GET /api/foods/search
 * @access  Private (or Public, but typically Private)
 */
exports.searchFoods = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(200).json([]);
    }

    const searchTerm = q.trim();

    // 1. Try Regex Search (most intuitive for partial matches like "chick" -> "chicken")
    // We prioritize prefix matches, then contains matches
    const regexResults = await Food.find({
      name: { $regex: searchTerm, $options: 'i' }
    }).limit(30);

    // 2. Try Text Search (good for multi-word relevance)
    let textResults = [];
    try {
      textResults = await Food.find(
        { $text: { $search: searchTerm } },
        { score: { $meta: 'textScore' } }
      )
      .sort({ score: { $meta: 'textScore' } })
      .limit(30);
    } catch (e) {
      // Text index might not be ready or erroring; ignore and use regex
      console.error('Text search error:', e.message);
    }

    // 3. Combine results, removing duplicates
    const combined = [...regexResults];
    const seenIds = new Set(combined.map(f => f._id.toString()));

    textResults.forEach(f => {
      if (!seenIds.has(f._id.toString())) {
        combined.push(f);
      }
    });

    // Return the first 25 results
    res.status(200).json(combined.slice(0, 25));
  } catch (error) {
    console.error('Error searching foods:', error);
    res.status(500).json({ message: 'Error searching foods' });
  }
};
