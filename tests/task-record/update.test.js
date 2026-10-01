import { describe, expect, it } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../app';
import User from '../../models/user';
import Task from '../../models/task';
import TaskRecord from '../../models/taskRecord';
import { CATEGORY, RECURRENCE, SCHEDULE, AUTO_REMOVE } from '../../constants';

describe('PATCH /api/task-record/update', () => {
  it('should update the task record', async () => {
    const user = await User.create({
      username: 'task-record-update-user',
      email: 'task-record-update@example.com',
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

    const taskRecord = await TaskRecord.create({
      userId: user._id,
      taskId: task._id,
      category: CATEGORY.REGULAR,
      score: 5,
      taskDate: new Date('2026-10-02').getTime()
    });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY);

    try {
      const response = await request(app)
        .patch('/api/task-record/update')
        .query({
          recordId: taskRecord._id.toString()
        })
        .set('Cookie', [`jwt-token=${token}`])
        .send({
          score: 10
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.taskRecord).toEqual(
        expect.objectContaining({
          _id: taskRecord._id.toString(),
          taskId: task._id.toString(),
          category: CATEGORY.REGULAR,
          score: 10
        })
      );
    } finally {
      await TaskRecord.deleteOne({ _id: taskRecord._id });
      await Task.deleteOne({ _id: task._id });
      await User.deleteOne({ _id: user._id });
    }
  }, 15000);
});
