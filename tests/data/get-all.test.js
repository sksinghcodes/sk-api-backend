import { describe, expect, it } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../app';
import User from '../../models/user';
import DataSource from '../../models/dataSource';
import Data from '../../models/data';

describe('GET /api/data/get-all/:dataSourceId', () => {
  it("should return all data belonging to the authenticated user's data source", async () => {
    const user = await User.create({
      username: 'getalluser',
      email: 'getall@example.com',
      password: 'Password123!',
      role: 1
    });

    const dataSource = await DataSource.create({
      source: 'http://localhost:3000',
      headings: ['name', 'message'],
      key: 'get-all-test-key',
      userId: user._id.toString()
    });

    const data1 = await Data.create({
      userId: user._id.toString(),
      dataSourceId: dataSource._id.toString(),
      name: 'John',
      message: 'Hello'
    });

    const data2 = await Data.create({
      userId: user._id.toString(),
      dataSourceId: dataSource._id.toString(),
      name: 'Jane',
      message: 'Hi'
    });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY);

    try {
      const response = await request(app)
        .get(`/api/data/get-all/${dataSource._id}`)
        .set('Cookie', [`jwt-token=${token}`]);

      expect(response.status).toBe(200);

      expect(response.body.success).toBe(true);
      expect(response.body.headings).toEqual(['name', 'message']);

      expect(response.body.datas).toHaveLength(2);

      expect(response.body.datas).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            _id: data1._id.toString(),
            name: 'John',
            message: 'Hello'
          }),
          expect.objectContaining({
            _id: data2._id.toString(),
            name: 'Jane',
            message: 'Hi'
          })
        ])
      );

      expect(response.body.datas[0]).not.toHaveProperty('userId');
      expect(response.body.datas[0]).not.toHaveProperty('dataSourceId');
      expect(response.body.datas[0]).not.toHaveProperty('updatedAt');
      expect(response.body.datas[0]).not.toHaveProperty('__v');
    } finally {
      await Data.deleteMany({
        userId: user._id.toString()
      });
      await DataSource.deleteOne({ _id: dataSource._id });
      await User.deleteOne({ _id: user._id });
    }
  }, 15000);
});
