import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { setPreferences, getPreferences } from '../controllers/preferencesController.js';

const router = express.Router();

router.put('/', verifyToken, setPreferences);
router.get('/', verifyToken, getPreferences);

export default router;