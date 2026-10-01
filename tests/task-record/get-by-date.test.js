import { describe, expect, it } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../app';
import User from '../../models/user';
import Task from '../../models/task';
import TaskRecord from '../../models/taskRecord';
import { CATEGORY, RECURRENCE, SCHEDULE, AUTO_REMOVE } from '../../constants';

describe('GET /api/task-record/by-date', () => {
  it('should return task records for the requested date range', async () => {
    const user = await User.create({
      username: 'task-record-by-date-user',
      email: 'task-record-by-date@example.com',
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
      score: 10,
      taskDate: new Date('2026-10-02').getTime()
    });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY);

    try {
      const response = await request(app)
        .get('/api/task-record/by-date')
        .query({
          taskId: task._id.toString(),
          fromDate: '2026_10_02',
          toDate: '2026_10_02'
        })
        .set('Cookie', [`jwt-token=${token}`]);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.taskRecords).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            _id: taskRecord._id.toString(),
            taskId: task._id.toString(),
            category: CATEGORY.REGULAR,
            score: 10
          })
        ])
      );
    } finally {
      await TaskRecord.deleteOne({ _id: taskRecord._id });
      await Task.deleteOne({ _id: task._id });
      await User.deleteOne({ _id: user._id });
    }
  }, 15000);
});
