import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { sqlite } from '../db/index.js';

const JWT_SECRET = 'default_jwt_secret_for_testing';

export function makeToken(userId: number, email: string): string {
  return jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: '1h' });
}

export interface SeedUser {
  id: number;
  email: string;
  token: string;
}

export async function seedUser(
  email = 'test@example.com',
  password = 'Password123!',
): Promise<SeedUser> {
  const hashed = await bcrypt.hash(password, 4); // low rounds for speed
  const result = sqlite
    .prepare('INSERT INTO users (email, password) VALUES (?, ?) RETURNING id, email')
    .get(email, hashed) as { id: number; email: string };
  return { id: result.id, email: result.email, token: makeToken(result.id, result.email) };
}

export const RECIPE_PAYLOAD = {
  title: 'Test Pasta',
  description: 'A simple pasta dish',
  prepTime: 10,
  cookTime: 20,
  estimatedCost: 8.5,
  difficulty: 'Easy',
  ingredients: JSON.stringify([{ name: 'Pasta', amount: 200, unit: 'g' }]),
  steps: JSON.stringify(['Boil water', 'Cook pasta']),
  categories: JSON.stringify(['dinner']),
};
