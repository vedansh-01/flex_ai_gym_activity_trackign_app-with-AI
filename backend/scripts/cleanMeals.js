const mongoose = require('mongoose');
require('dotenv').config();

async function cleanMeals() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/flexai');
  // Delete all meals that don't have a proper 'foods' array
  const result = await mongoose.connection.db.collection('meals').deleteMany({ foods: { $exists: false } });
  console.log('Deleted stale meal records (old schema):', result.deletedCount);
  await mongoose.disconnect();
}

cleanMeals().catch(console.error);
