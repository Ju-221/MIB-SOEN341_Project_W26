import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { calendar } from "../db/schema.js";
import { Request, Response } from "express";

// GET CALENDAR — returns the calendar for a given month & year
export const getCalendar = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { months } = req.query;

    if (!months) {
      res.status(400).json({ message: "months query param is required" });
      return;
    }

    let requestedMonths: string[];
    try {
      requestedMonths = JSON.parse(String(months)).map((m: string) =>
        m.toUpperCase(),
      );
      if (!Array.isArray(requestedMonths)) throw new Error();
    } catch {
      res
        .status(400)
        .json({ message: "months must be a JSON array of month:year strings" });
      return;
    }

    const existing = db
      .select()
      .from(calendar)
      .where(eq(calendar.userId, userId))
      .get();

    if (!existing) {
      res.json({ months: [], days: [] });
      return;
    }

    const storedMonths: string[] = JSON.parse(existing.months);
    const storedDays: object[] = JSON.parse(existing.days);

    const monthMap = new Map<string, object>();
    storedMonths.forEach((month, i) => monthMap.set(month, storedDays[i]));

    const resultMonths: string[] = [];
    const resultDays: object[] = [];

    for (const month of requestedMonths) {
      if (monthMap.has(month)) {
        resultMonths.push(month);
        resultDays.push(monthMap.get(month)!);
      }
    }

    res.json({ months: resultMonths, days: resultDays });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};
// SET CALENDAR — creates or fully replaces the calendar for a given month & year
export const setCalendar = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { months, days } = req.body;

    if (!months || !days) {
      res
        .status(400)
        .json({ message: "months and days properties are required" });
      return;
    }
    const monthsJson = JSON.stringify(
      months.map((m: string) => m.toUpperCase()),
    );
    const daysJson = JSON.stringify(days); // store the days array as a JSON string // days will now be an array of 7 objects each representing the days of a month  from the months seen from the months property
    const now = new Date().toISOString();

    const existing = db
      .select()
      .from(calendar)
      .where(eq(calendar.userId, userId))
      .get();

    if (existing) {
      // Replace the existing calendar (one row per user — update month/year too)
      db.update(calendar)
        .set({ months: monthsJson, days: daysJson, lastModified: now })
        .where(eq(calendar.userId, userId))
        .run();
    } else {
      // First save — create the single calendar entry for this user
      db.insert(calendar)
        .values({
          userId,
          months: monthsJson,
          days: daysJson,
          lastModified: now,
        })
        .run();
    }

    res.json({ message: "Calendar saved successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};
