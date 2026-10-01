import express from 'express';
import { create, getByDate, update } from '../controllers/taskRecord';

const router = express.Router();

router.post('/create', create);
router.patch('/update', update);
router.get('/by-date', getByDate);

export default router;
