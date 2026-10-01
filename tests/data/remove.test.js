import { describe, expect, it } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../app';
import User from '../../models/user';
import DataSource from '../../models/dataSource';
import Data from '../../models/data';

describe('DELETE /api/data/:id', () => {
  it("should delete the user's data and return the remaining data", async () => {
    const user = await User.create({
      username: 'removeuser',
      email: 'remove@example.com',
      password: 'Password123!',
      role: 1
    });

    const dataSource = await DataSource.create({
      source: 'http://localhost:3000',
      headings: ['name', 'message'],
      key: 'remove-test-key',
      userId: user._id.toString()
    });

    const dataToDelete = await Data.create({
      userId: user._id.toString(),
      dataSourceId: dataSource._id.toString(),
      name: 'John',
      message: 'Delete me'
    });

    const remainingData = await Data.create({
      userId: user._id.toString(),
      dataSourceId: dataSource._id.toString(),
      name: 'Jane',
      message: 'Keep me'
    });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY);

    try {
      const response = await request(app)
        .delete(`/api/data/${dataToDelete._id}`)
        .set('Cookie', [`jwt-token=${token}`]);

      expect(response.status).toBe(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('One data deleted');
      expect(response.body.headings).toEqual(['name', 'message']);

      expect(response.body.datas).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            _id: remainingData._id.toString(),
            name: 'Jane',
            message: 'Keep me'
          })
        ])
      );

      expect(response.body.datas).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            _id: dataToDelete._id.toString()
          })
        ])
      );

      const deletedData = await Data.findById(dataToDelete._id);

      expect(deletedData).toBeNull();
    } finally {
      await Data.deleteMany({
        userId: user._id.toString()
      });
      await DataSource.deleteOne({ _id: dataSource._id });
      await User.deleteOne({ _id: user._id });
    }
  }, 15000);
});
