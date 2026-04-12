import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { Request, Response } from 'express';

export const getUser = (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const user = db.select().from(users).where(eq(users.id, userId)).get();
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json({
      email: user.email,
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateUser = (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { firstName, lastName } = req.body as { firstName?: string; lastName?: string };

    // Only update fields that were explicitly provided in the request body.
    const patch: Partial<typeof users.$inferInsert> = {};
    if (firstName !== undefined) patch.firstName = firstName.trim() || null;
    if (lastName !== undefined) patch.lastName = lastName.trim() || null;

    if (Object.keys(patch).length > 0) {
      db.update(users).set(patch).where(eq(users.id, userId)).run();
    }

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
