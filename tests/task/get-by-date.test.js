import { describe, expect, it } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../app';
import User from '../../models/user';
import Task from '../../models/task';
import { CATEGORY, RECURRENCE, SCHEDULE, AUTO_REMOVE } from '../../constants';

describe('GET /api/task/get-by-date', () => {
  it('should return tasks scheduled for the requested date', async () => {
    const user = await User.create({
      username: 'task-get-by-date-user',
      email: 'task-get-by-date@example.com',
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
        .get('/api/task/get-by-date')
        .query({
          date: '2026_10_02'
        })
        .set('Cookie', [`jwt-token=${token}`]);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      expect(response.body.tasks).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            _id: task._id.toString(),
            name: 'Daily task',
            category: CATEGORY.REGULAR,
            recurrence: RECURRENCE.DAILY,
            schedule: SCHEDULE.NOT_TIMED,
            autoRemove: AUTO_REMOVE.NEVER,
            taskRecord: null
          })
        ])
      );
    } finally {
      await Task.deleteOne({ _id: task._id });
      await User.deleteOne({ _id: user._id });
    }
  }, 15000);
});
