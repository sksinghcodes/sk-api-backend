import { describe, expect, it } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../app';
import User from '../../models/user';
import Task from '../../models/task';
import { CATEGORY, RECURRENCE, SCHEDULE, AUTO_REMOVE } from '../../constants';

describe('GET /api/task/get-one', () => {
  it('should return the requested task', async () => {
    const user = await User.create({
      username: 'task-get-one-user',
      email: 'task-get-one@example.com',
      password: 'password123'
    });

    const task = await Task.create({
      userId: user._id,
      name: 'Read book',
      category: CATEGORY.REGULAR,
      recurrence: RECURRENCE.DAILY,
      schedule: SCHEDULE.NOT_TIMED,
      autoRemove: AUTO_REMOVE.NEVER
    });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY);

    try {
      const response = await request(app)
        .get('/api/task/get-one')
        .query({
          taskId: task._id.toString()
        })
        .set('Cookie', [`jwt-token=${token}`]);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.task).toEqual(
        expect.objectContaining({
          _id: task._id.toString(),
          name: 'Read book',
          category: CATEGORY.REGULAR,
          recurrence: RECURRENCE.DAILY,
          schedule: SCHEDULE.NOT_TIMED,
          autoRemove: AUTO_REMOVE.NEVER
        })
      );
    } finally {
      await Task.deleteOne({ _id: task._id });
      await User.deleteOne({ _id: user._id });
    }
  }, 15000);
});
