import express from 'express';
import { create, getAll, remove } from '../controllers/dataSource';

const router = express.Router();

router.post('/', create);
router.get('/get-all', getAll);
router.delete('/:id', remove);

export default router;
