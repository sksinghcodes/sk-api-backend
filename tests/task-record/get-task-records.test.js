import { describe, expect, it } from 'vitest';
import User from '../../models/user';
import Task from '../../models/task';
import TaskRecord from '../../models/taskRecord';
import { getTaskRecords } from '../../controllers/taskRecord';
import { CATEGORY, RECURRENCE, SCHEDULE, AUTO_REMOVE } from '../../constants';

describe('getTaskRecords', () => {
  it('should return task records within the requested date range', async () => {
    const user = await User.create({
      username: 'get-task-records-user',
      email: 'get-task-records@example.com',
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

    try {
      const records = await getTaskRecords({
        taskId: task._id,
        userId: user._id,
        fromDate: new Date('2026-10-02'),
        toDate: new Date('2026-10-02')
      });

      expect(records).toHaveLength(1);
      expect(records[0]._id.toString()).toBe(taskRecord._id.toString());
      expect(records[0].taskId.toString()).toBe(task._id.toString());
      expect(records[0].score).toBe(10);
    } finally {
      await TaskRecord.deleteOne({ _id: taskRecord._id });
      await Task.deleteOne({ _id: task._id });
      await User.deleteOne({ _id: user._id });
    }
  }, 15000);
});
