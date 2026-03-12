import { eq, and } from 'drizzle-orm';
import { db } from '../db/index.js';
import { calendar } from '../db/schema.js';
import { Request, Response } from 'express';

// GET CALENDAR — returns the calendar for a given month & year
export const getCalendar = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { month, year } = req.query;

    if (!month || !year) {
      res.status(400).json({ message: 'month and year query params are required' });
      return;
    }

    const existing = db
      .select()
      .from(calendar)
      .where(
        and(
          eq(calendar.userId, userId),
          eq(calendar.month, String(month)),
          eq(calendar.year, Number(year))
        )
      )
      .get();

    if (!existing) {
      res.status(404).json({ message: 'No calendar found for that month/year' });
      return;
    }

    res.json({
      ...existing,
      days: JSON.parse(existing.days), // send days as a parsed array, not a raw string
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong' });
  }
};

// SET CALENDAR — creates or fully replaces the calendar for a given month & year
export const setCalendar = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { month, year, days } = req.body;

    if (!month || !year || !days) {
      res.status(400).json({ message: 'month, year, and days are required' });
      return;
    }

    const daysJson = JSON.stringify(days); // store the days array as a JSON string
    const now = new Date().toISOString();

    const existing = db
      .select()
      .from(calendar)
      .where(
        and(
          eq(calendar.userId, userId),
          eq(calendar.month, String(month)),
          eq(calendar.year, Number(year))
        )
      )
      .get();

    if (existing) {
      // Replace the old calendar entirely
      db.update(calendar)
        .set({ days: daysJson, lastModified: now })
        .where(
          and(
            eq(calendar.userId, userId),
            eq(calendar.month, String(month)),
            eq(calendar.year, Number(year))
          )
        )
        .run();
    } else {
      // Create a new calendar entry
      db.insert(calendar)
        .values({ userId, month: String(month), year: Number(year), days: daysJson, lastModified: now })
        .run();
    }

    res.json({ message: 'Calendar saved successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong' });
  }
};
