const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const csvFilePath = path.join(__dirname, '../data/indian_food.csv');
const outputFilePath = path.join(__dirname, '../../frontend/src/data/foods.json');

// Ensure directory exists
const dir = path.dirname(outputFilePath);
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

const foods = [];

fs.createReadStream(csvFilePath)
  .pipe(csv())
  .on('data', (row) => {
    // Map CSV columns to a clean format for the frontend
    const foodItem = {
      id: row['Dish Name'].toLowerCase().replace(/\s+/g, '-'),
      name: row['Dish Name'],
      calories: parseFloat(row['Calories (kcal)']) || 0,
      carbs: parseFloat(row['Carbohydrates (g)']) || 0,
      protein: parseFloat(row['Protein (g)']) || 0,
      fats: parseFloat(row['Fats (g)']) || 0,
      // Default serving units
      servingUnit: 'g',
      gramsPerUnit: null
    };

    // Add piece-based logic for common items
    const name = foodItem.name.toLowerCase();
    if (name.includes('chapati') || name.includes('roti') || name.includes('phulka')) {
        foodItem.servingUnit = 'piece';
        foodItem.gramsPerUnit = 30;
    } else if (name.includes('idli')) {
        foodItem.servingUnit = 'piece';
        foodItem.gramsPerUnit = 40;
    } else if (name.includes('samosa')) {
        foodItem.servingUnit = 'piece';
        foodItem.gramsPerUnit = 65;
    } else if (name.includes('egg') && (name.includes('boiled') || name.includes('fried'))) {
        foodItem.servingUnit = 'piece';
        foodItem.gramsPerUnit = 55;
    }

    if (foodItem.name) {
      foods.push(foodItem);
    }
  })
  .on('end', () => {
    fs.writeFileSync(outputFilePath, JSON.stringify(foods, null, 2));
    console.log(`✅ Exported ${foods.length} foods to ${outputFilePath}`);
  });
