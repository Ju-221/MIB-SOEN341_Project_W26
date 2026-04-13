import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { getUser, updateUser } from '../controllers/userController.js';

const router = express.Router();

router.get('/', verifyToken, getUser);
router.put('/', verifyToken, updateUser);

export default router;
