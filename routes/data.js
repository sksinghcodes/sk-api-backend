import express from 'express';
import cors from 'cors';
import { create, getAll, remove } from '../controllers/data';

const router = express.Router();

router.post('/', cors(), create);
router.get('/get-all/:dataSourceId', getAll);
router.delete('/:id', remove);

export default router;
