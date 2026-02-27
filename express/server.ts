import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';


const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env first, then .env.example as fallback
dotenv.config({ path: path.join(__dirname, '../.env.example') });
const result = dotenv.config({ path: path.join(__dirname, '../.env') });
console.log(result)

const PORT = process.env.PORT || 3000;

const app = express();

// MIDDLEWARE
app.use(cors({ origin: 'http://localhost:8080' }));
app.use(express.json());

// ROUTES

import authRoutes from './routes/auth.js';
app.use('/api/auth', authRoutes);

import preferencesRoutes from './routes/preferences.js';
app.use('/api/preferences', preferencesRoutes);

import recipesRoutes from './routes/recipes.js';
app.use('/api/recipes', recipesRoutes);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
    res.json({ message: 'MealMajor API is running...' });
})

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})
