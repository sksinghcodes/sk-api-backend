import { describe, expect, it } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../app';
import User from '../../models/user';
import Task from '../../models/task';
import TaskRecord from '../../models/taskRecord';
import { CATEGORY, RECURRENCE, SCHEDULE, AUTO_REMOVE } from '../../constants';

describe('POST /api/task-record/create', () => {
  it('should create a task record', async () => {
    const user = await User.create({
      username: 'task-record-create-user',
      email: 'task-record-create@example.com',
      password: 'password123'
    });

    const task = await Task.create({
      userId: user._id,
      name: 'Daily task',
      category: CATEGORY.REGULAR,
      recurrence: RECURRENCE.DAILY,
      schedule: SCHEDULE.NOT_TIMED,
      autoRemove: AUTO_REMOVE.NEVER
    });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY);

    try {
      const response = await request(app)
        .post('/api/task-record/create')
        .query({
          taskId: task._id.toString(),
          taskDate: '2026_10_02'
        })
        .set('Cookie', [`jwt-token=${token}`])
        .send({
          score: 10
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.taskRecord).toEqual(
        expect.objectContaining({
          taskId: task._id.toString(),
          category: CATEGORY.REGULAR,
          score: 10
        })
      );
    } finally {
      await TaskRecord.deleteMany({ taskId: task._id });
      await Task.deleteOne({ _id: task._id });
      await User.deleteOne({ _id: user._id });
    }
  }, 15000);
});
