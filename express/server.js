import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

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

app.get('/', (req, res) => {
    res.json({ message: 'MealMajor API is running...' });
})

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})