import { describe, expect, it } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../app';
import User from '../../models/user';
import Task from '../../models/task';
import { CATEGORY, RECURRENCE, SCHEDULE, AUTO_REMOVE } from '../../constants';

describe('GET /api/task/get-all', () => {
  it('should return all non-deleted tasks belonging to the user', async () => {
    const user = await User.create({
      username: 'getalltaskuser',
      email: 'getalltask@example.com',
      password: 'Password123!',
      role: 1
    });

    const task1 = await Task.create({
      userId: user._id,
      name: 'Task 1',
      category: CATEGORY.REGULAR,
      recurrence: RECURRENCE.DAILY,
      schedule: SCHEDULE.NOT_TIMED,
      autoRemove: AUTO_REMOVE.NEVER
    });

    const task2 = await Task.create({
      userId: user._id,
      name: 'Task 2',
      category: CATEGORY.REGULAR,
      recurrence: RECURRENCE.DAILY,
      schedule: SCHEDULE.NOT_TIMED,
      autoRemove: AUTO_REMOVE.NEVER
    });

    const deletedTask = await Task.create({
      userId: user._id,
      name: 'Deleted task',
      category: CATEGORY.REGULAR,
      recurrence: RECURRENCE.DAILY,
      schedule: SCHEDULE.NOT_TIMED,
      autoRemove: AUTO_REMOVE.NEVER,
      deleted: true
    });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY);

    try {
      const response = await request(app)
        .get('/api/task/get-all')
        .set('Cookie', [`jwt-token=${token}`]);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      expect(response.body.tasks).toHaveLength(2);

      expect(response.body.tasks).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            _id: task1._id.toString(),
            name: 'Task 1'
          }),
          expect.objectContaining({
            _id: task2._id.toString(),
            name: 'Task 2'
          })
        ])
      );

      expect(response.body.tasks).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            _id: deletedTask._id.toString()
          })
        ])
      );

      expect(response.body.tasks[0]).not.toHaveProperty('userId');
      expect(response.body.tasks[0]).not.toHaveProperty('__v');
    } finally {
      await Task.deleteMany({ userId: user._id });
      await User.deleteOne({ _id: user._id });
    }
  }, 15000);
});
