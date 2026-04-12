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

    db.update(users)
      .set({
        firstName: firstName?.trim() ?? null,
        lastName: lastName?.trim() ?? null,
      })
      .where(eq(users.id, userId))
      .run();

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
