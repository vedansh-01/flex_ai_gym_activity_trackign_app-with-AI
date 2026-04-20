/**
 * Migration: Tag piece-based foods in the DB
 *
 * All macros in DB are stored per 100g (from the Indian Food Nutrition CSV).
 * Piece-based logic: when user enters "2 chapatis":
 *   actualGrams = 2 × gramsPerUnit
 *   scale = actualGrams / 100
 *   scaled_macros = baseline_macros × scale
 */

const mongoose = require('mongoose');
require('dotenv').config();
const Food = require('../src/models/Food');

// Each entry: keywords (case-insensitive substring match) + grams per 1 piece
const UNIT_FOOD_MAP = [
  // ── Breads & Rotis ──────────────────────────────────────────────────────────
  { keywords: ['Chapati', 'Roti', 'chapati', 'roti', 'phulka'],      grams: 30  },
  { keywords: ['Makki ki roti'],                                        grams: 40  },
  { keywords: ['Paushtik roti', 'Soya roti', 'Missi roti'],           grams: 35  },
  { keywords: ['parantha', 'paratha'],                                  grams: 75  },
  { keywords: ['Puri', 'Poori', 'puri', 'poori'],                     grams: 30  },
  { keywords: ['Bhatura', 'bhatura'],                                   grams: 90  },
  { keywords: ['Naan', 'naan', 'Kulcha', 'kulcha'],                   grams: 90  },
  { keywords: ['Tandoori roti'],                                        grams: 55  },
  { keywords: ['Thepla'],                                               grams: 35  },

  // ── South Indian ────────────────────────────────────────────────────────────
  { keywords: ['Idli', 'idli', 'Semolina idli', 'Instant idli'],     grams: 40  },
  { keywords: ['dosa', 'Dosa', 'dosai'],                               grams: 85  },
  { keywords: ['Uttapam', 'uttapam', 'Uthappam'],                     grams: 110 },
  { keywords: ['Appam', 'appam'],                                       grams: 55  },
  { keywords: ['vada', 'Vada', 'wada'],                                grams: 55  },

  // ── Eggs ─────────────────────────────────────────────────────────────────── 
  { keywords: ['Boiled egg', 'Baked egg', 'Scrambled egg', 'Poached egg',
               'Fried egg', 'Egg omelette', 'Deviled egg'],           grams: 55  },

  // ── Samosas / Kachori / Snacks ───────────────────────────────────────────── 
  { keywords: ['samosa', 'Samosa'],                                     grams: 65  },
  { keywords: ['Kachori', 'kachori'],                                   grams: 65  },
  { keywords: ['Pani puri', 'pani puri', 'Golgappa', 'Puchka'],      grams: 12  },
  { keywords: ['Dhokla', 'dhokla'],                                     grams: 45  },
  { keywords: ['Pakora', 'pakora', 'Pakoda', 'Bhajia'],               grams: 20  },
  { keywords: ['Aloo tikki'],                                           grams: 70  },
  { keywords: ['Mathri'],                                               grams: 15  },
  { keywords: ['Murukku'],                                              grams: 15  },
  { keywords: ['Papad', 'papad', 'Appalam', 'Poppadom'],              grams: 10  },
  { keywords: ['Banana chips'],                                         grams: 15  },
  { keywords: ['Sev'],                                                  grams: 15  },

  // ── Sweets / Mithai ──────────────────────────────────────────────────────── 
  { keywords: ['Gulab jamun', 'Gulab Jamun'],                          grams: 35  },
  { keywords: ['Rasgulla', 'rasgulla'],                                 grams: 40  },
  { keywords: ['Laddoo', 'laddoo', 'Ladoo', 'Laddu', 'laddu'],       grams: 50  },
  { keywords: ['Jalebi', 'jalebi'],                                     grams: 30  },
  { keywords: ['Modak', 'modak'],                                       grams: 35  },
  { keywords: ['Barfi', 'barfi', 'Burfi'],                             grams: 40  },
  { keywords: ['Peda', 'peda'],                                         grams: 30  },
  { keywords: ['Rasmalai', 'rasmalai'],                                 grams: 50  },
  { keywords: ['Kaju katli', 'Kaju barfi'],                             grams: 20  },
  { keywords: ['Gujiya', 'gujiya'],                                     grams: 50  },
  { keywords: ['Malpua', 'malpua'],                                     grams: 45  },
  { keywords: ['Balushahi'],                                            grams: 40  },
  { keywords: ['Panjiri'],                                              grams: 50  },

  // ── Fruits (whole) ───────────────────────────────────────────────────────── 
  { keywords: ['Banana appam'],                                         grams: 55  }, // keep as piece
  // Note: most fruits appear as juices/salads in this dataset, not whole fruits
];

async function migrate() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/flexai');
  console.log('Connected to MongoDB...\n');

  let totalUpdated = 0;

  for (const entry of UNIT_FOOD_MAP) {
    for (const keyword of entry.keywords) {
      const regex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      const result = await Food.updateMany(
        { name: regex, $or: [{ servingUnit: 'g' }, { servingUnit: { $exists: false } }] },
        { $set: { servingUnit: 'piece', gramsPerUnit: entry.grams } }
      );
      if (result.modifiedCount > 0) {
        console.log(`  ✓ "${keyword}" → ${result.modifiedCount} item(s) tagged as piece (${entry.grams}g each)`);
        totalUpdated += result.modifiedCount;
      }
    }
  }

  // Print a sample of what got tagged for verification
  console.log('\n─── Sample of piece-tagged foods ───────────────────────────────');
  const sample = await Food.find({ servingUnit: 'piece' }, { name: 1, gramsPerUnit: 1 }).limit(20);
  sample.forEach(f => console.log(`  ${f.name} → ${f.gramsPerUnit}g/piece`));

  console.log(`\n✅ Migration complete. ${totalUpdated} food items tagged as piece-based.`);
  await mongoose.disconnect();
}

migrate().catch(console.error);
