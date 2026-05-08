import { Asset } from 'expo-asset';
import Papa from 'papaparse';
import { Alert } from 'react-native';

/**
 * Loads and parses the food CSV file from assets.
 * Returns an array of food objects compatible with the app.
 */
export const loadFoodDatabase = async () => {
  try {
    const asset = Asset.fromModule(require('../../assets/data/food.csv'));
    
    // Ensure the asset is downloaded/available
    await asset.downloadAsync();
    
    // Use fetch to read the asset content (more reliable for bundled assets in production)
    const response = await fetch(asset.uri);
    const csvContent = await response.text();
    
    if (!csvContent || csvContent.length < 10) {
      throw new Error('CSV content is empty or too short');
    }

    return new Promise((resolve, reject) => {
      Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        complete: (results) => {
          if (!results.data || results.data.length === 0) {
            resolve([]);
            return;
          }

          // Map CSV headers to app-internal format
          // Expected Header: Dish Name,Calories (kcal),Carbohydrates (g),Protein (g),Fats (g)
          const mapped = results.data.map((item, index) => ({
            id: `csv-${index}`,
            name: item['Dish Name'] || 'Unknown Dish',
            calories: parseFloat(item['Calories (kcal)']) || 0,
            carbs: parseFloat(item['Carbohydrates (g)']) || 0,
            protein: parseFloat(item['Protein (g)']) || 0,
            fats: parseFloat(item['Fats (g)']) || 0,
            servingUnit: 'g',
            gramsPerUnit: 100 // Standard 100g basis
          }));
          
          console.log(`✅ Loaded ${mapped.length} foods from database.`);
          resolve(mapped);
        },
        error: (err) => {
          console.error('PapaParse Error:', err);
          reject(err);
        }
      });
    });
  } catch (error) {
    console.error('Error loading food CSV:', error);
    // Alert.alert('Database Error', 'Failed to load food database. Search will be unavailable.');
    return [];
  }
};
