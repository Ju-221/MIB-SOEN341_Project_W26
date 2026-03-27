import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { getCalendar, setCalendar } from '../controllers/calendarController.js';

const router = express.Router();

router.post('/', verifyToken, setCalendar);
router.get('/', verifyToken, getCalendar);

export default router;