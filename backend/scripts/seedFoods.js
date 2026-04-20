const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const dotenv = require('dotenv');
const Food = require('../src/models/Food');

// Load env vars
dotenv.config();

const csvFilePath = path.join(__dirname, '../data/indian_food.csv');

async function seedFoods() {
  try {
    // 1. Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/flexai';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for seeding...');

    // 2. Clear existing foods (optional, but good for clean start during dev)
    const existingCount = await Food.countDocuments();
    if (existingCount > 0) {
      console.log(`Clearing ${existingCount} existing food items...`);
      await Food.deleteMany({});
    }

    const foods = [];

    // 3. Read and parse CSV
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => {
        // Map CSV columns to Food model
        // Header: Dish Name,Calories (kcal),Carbohydrates (g),Protein (g),Fats (g),Free Sugar (g),Fibre (g),Sodium (mg),Calcium (mg),Iron (mg),Vitamin C (mg),Folate (Ag)
        const foodItem = {
          name: row['Dish Name'],
          calories: parseFloat(row['Calories (kcal)']) || 0,
          carbs: parseFloat(row['Carbohydrates (g)']) || 0,
          protein: parseFloat(row['Protein (g)']) || 0,
          fats: parseFloat(row['Fats (g)']) || 0,
          sugar: parseFloat(row['Free Sugar (g)']) || 0,
          fiber: parseFloat(row['Fibre (g)']) || 0,
          sodium: parseFloat(row['Sodium (mg)']) || 0,
          calcium: parseFloat(row['Calcium (mg)']) || 0,
          iron: parseFloat(row['Iron (mg)']) || 0,
          vitaminC: parseFloat(row['Vitamin C (mg)']) || 0,
        };

        if (foodItem.name) {
          foods.push(foodItem);
        }
      })
      .on('end', async () => {
        console.log(`CSV parsed. Inserting ${foods.length} dishes...`);
        try {
          await Food.insertMany(foods);
          console.log('Seed successful! Added', foods.length, 'dishes.');
          process.exit(0);
        } catch (err) {
          console.error('Error inserting foods:', err);
          process.exit(1);
        }
      });

  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

seedFoods();
