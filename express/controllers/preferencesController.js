import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { allergies, dietaryPreferences } from '../db/schema.js';

// SET PREFERENCES
export const setPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const { allergies: allergyData, dietaryPreferences: dietData } = req.body;

    //  allergies
    const existingAllergy = db.select().from(allergies).where(eq(allergies.userId, userId)).get();
    
    if (existingAllergy) {
      db.update(allergies).set(allergyData).where(eq(allergies.userId, userId)).run();
    } else {
      db.insert(allergies).values({ userId, ...allergyData }).run();
    }

    //  dietary preferences
    const existingDiet = db.select().from(dietaryPreferences).where(eq(dietaryPreferences.userId, userId)).get();
    
    if (existingDiet) {
      db.update(dietaryPreferences).set(dietData).where(eq(dietaryPreferences.userId, userId)).run();
    } else {
      db.insert(dietaryPreferences).values({ userId, ...dietData }).run();
    }

    res.json({ message: 'Preferences updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong' });
  }
};

// GET PREFERENCES
export const getPreferences = async (req, res) => {
  try {
    const userId = req.user.id;

    const userAllergies = db.select().from(allergies).where(eq(allergies.userId, userId)).get();
    const userDiet = db.select().from(dietaryPreferences).where(eq(dietaryPreferences.userId, userId)).get();

    res.json({
      allergies: userAllergies || {},
      dietaryPreferences: userDiet || {}
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong' });
  }
};