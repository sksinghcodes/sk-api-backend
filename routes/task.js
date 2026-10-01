import express from 'express';
import {
  create,
  getOne,
  getByDate,
  getAll,
  removeTask,
  update
} from '../controllers/task';

const router = express.Router();

router.post('/create', create);
router.patch('/update', update);
router.get('/get-one', getOne);
router.get('/get-all', getAll);
router.get('/get-by-date', getByDate);
router.delete('/delete', removeTask);

export default router;
