import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.disable('x-powered-by');

app.use(cors({ origin: 'http://localhost:8080' }));
app.use(express.json());

import authRoutes from './routes/auth.js';
app.use('/api/auth', authRoutes);

import preferencesRoutes from './routes/preferences.js';
app.use('/api/preferences', preferencesRoutes);

import recipesRoutes from './routes/recipes.js';
app.use('/api/recipes', recipesRoutes);

import calendarRoutes from './routes/calendar.js';
app.use('/api/calendar', calendarRoutes);

import userRoutes from './routes/user.js';
app.use('/api/user', userRoutes);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (_req, res) => {
  res.json({ message: 'MealMajor API is running...' });
});

export default app;
