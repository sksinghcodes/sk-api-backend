import express from 'express';
import { create } from '../controllers/data';

const router = express.Router();

router.post('/', create);

export default router;
