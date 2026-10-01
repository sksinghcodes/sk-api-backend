import { describe, expect, it } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../app';
import User from '../../models/user';
import Task from '../../models/task';
import { CATEGORY, RECURRENCE, SCHEDULE, AUTO_REMOVE } from '../../constants';

describe('POST /api/task/create', () => {
  it('should create a new task', async () => {
    const user = await User.create({
      username: 'createtaskuser',
      email: 'createtask@example.com',
      password: 'Password123!',
      role: 1
    });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY);

    try {
      const response = await request(app)
        .post('/api/task/create')
        .set('Cookie', [`jwt-token=${token}`])
        .send({
          name: 'Exercise',
          description: 'Morning exercise',
          schedule: SCHEDULE.NOT_TIMED,
          category: CATEGORY.REGULAR,
          recurrence: RECURRENCE.DAILY,
          recurrenceValues: null,
          recurrenceInvalidDateStrategy: null,
          autoRemove: AUTO_REMOVE.NEVER,
          autoRemoveDate: null
        });

      expect(response.status).toBe(200);

      expect(response.body).toEqual({
        success: true,
        message: 'New task created',
        task: expect.objectContaining({
          name: 'Exercise',
          description: 'Morning exercise',
          schedule: SCHEDULE.MORNING,
          category: CATEGORY.REGULAR,
          recurrence: RECURRENCE.DAILY,
          schedule: SCHEDULE.NOT_TIMED,
          autoRemove: AUTO_REMOVE.NEVER,
          autoRemoveDate: null,
          deleted: false,
          allowEdit: true,
          taskRecord: null
        })
      });

      expect(response.body.task).not.toHaveProperty('userId');
      expect(response.body.task).not.toHaveProperty('__v');

      const savedTask = await Task.findById(response.body.task._id);

      expect(savedTask).not.toBeNull();
      expect(savedTask.userId.toString()).toBe(user._id.toString());
    } finally {
      await Task.deleteMany({ userId: user._id });
      await User.deleteOne({ _id: user._id });
    }
  }, 15000);
});
