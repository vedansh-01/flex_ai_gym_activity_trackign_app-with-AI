const mongoose = require('mongoose');
const Food = require('./src/models/Food');
require('dotenv').config();

const checkDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/flexai');
    const count = await Food.countDocuments();
    console.log(`Food collection count: ${count}`);
    const sample = await Food.findOne();
    console.log(`Sample food: ${JSON.stringify(sample)}`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

checkDB();
