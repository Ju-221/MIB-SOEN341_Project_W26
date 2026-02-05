import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';

// SIGNUP
export const signup = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const existingUser = db.select().from(users).where(eq(users.email, email)).get();
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const result = db.insert(users).values({
      email,
      password: hashedPassword
    }).returning().get();

    // Generate token
    const token = jwt.sign(
      { id: result.id, email: result.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({ 
      user: { id: result.id, email: result.email }, 
      token 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong' });
  }
};

// SIGNIN
export const signin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = db.select().from(users).where(eq(users.email, email)).get();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ 
      user: { id: user.id, email: user.email }, 
      token 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong' });
  }
};