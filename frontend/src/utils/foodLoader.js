import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import Papa from 'papaparse';

/**
 * Loads and parses the food CSV file from assets.
 * Returns an array of food objects compatible with the app.
 */
export const loadFoodDatabase = async () => {
  try {
    const asset = Asset.fromModule(require('../../assets/data/food.csv'));
    await asset.downloadAsync();
    
    const csvContent = await FileSystem.readAsStringAsync(asset.localUri || asset.uri);
    
    return new Promise((resolve, reject) => {
      Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        complete: (results) => {
          // Map CSV headers to app-internal format
          // Header: Dish Name,Calories (kcal),Carbohydrates (g),Protein (g),Fats (g),...
          const mapped = results.data.map((item, index) => ({
            id: `csv-${index}`,
            name: item['Dish Name'] || 'Unknown Dish',
            calories: item['Calories (kcal)'] || 0,
            carbs: item['Carbohydrates (g)'] || 0,
            protein: item['Protein (g)'] || 0,
            fats: item['Fats (g)'] || 0,
            servingUnit: 'g',
            gramsPerUnit: null
          }));
          resolve(mapped);
        },
        error: (err) => reject(err)
      });
    });
  } catch (error) {
    console.error('Error loading food CSV:', error);
    return [];
  }
};
