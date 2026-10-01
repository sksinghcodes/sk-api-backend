import { describe, expect, it } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../app';
import User from '../../models/user';
import Task from '../../models/task';
import { CATEGORY, RECURRENCE, SCHEDULE, AUTO_REMOVE } from '../../constants';

describe('DELETE /api/task/delete', () => {
  it('should delete the task', async () => {
    const user = await User.create({
      username: 'deletetaskuser',
      email: 'deletetask@example.com',
      password: 'Password123!',
      role: 1
    });

    const task = await Task.create({
      userId: user._id,
      name: 'Delete me',
      category: CATEGORY.REGULAR,
      recurrence: RECURRENCE.DAILY,
      schedule: SCHEDULE.NOT_TIMED,
      autoRemove: AUTO_REMOVE.NEVER
    });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY);

    try {
      const response = await request(app)
        .delete(`/api/task/delete?taskId=${task._id}`)
        .set('Cookie', [`jwt-token=${token}`]);

      expect(response.status).toBe(200);

      expect(response.body).toEqual({
        success: true,
        message: 'deleted successfully'
      });

      const deletedTask = await Task.findById(task._id);

      expect(deletedTask).toBeNull();
    } finally {
      await Task.deleteOne({ _id: task._id });
      await User.deleteOne({ _id: user._id });
    }
  }, 15000);
});
