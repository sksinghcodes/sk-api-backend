import { describe, expect, it } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../app';
import User from '../../models/user';
import DataSource from '../../models/dataSource';

describe('GET /api/data-source/get-all', () => {
  it('should return all data sources belonging to the authenticated user', async () => {
    const user = await User.create({
      username: 'getdatasourcesuser',
      email: 'getdatasources@example.com',
      password: 'Password123!',
      role: 1
    });

    const dataSource1 = await DataSource.create({
      source: 'https://example.com/form-1',
      headings: ['name', 'email'],
      key: 'data-source-key-1',
      userId: user._id.toString()
    });

    const dataSource2 = await DataSource.create({
      source: 'https://example.com/form-2',
      headings: ['name', 'message'],
      key: 'data-source-key-2',
      userId: user._id.toString()
    });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY);

    try {
      const response = await request(app)
        .get('/api/data-source/get-all')
        .set('Cookie', [`jwt-token=${token}`]);

      expect(response.status).toBe(200);

      expect(response.body.success).toBe(true);

      expect(response.body.dataSources).toHaveLength(2);

      expect(response.body.dataSources).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            _id: dataSource1._id.toString(),
            source: 'https://example.com/form-1',
            headings: ['name', 'email'],
            key: 'data-source-key-1'
          }),
          expect.objectContaining({
            _id: dataSource2._id.toString(),
            source: 'https://example.com/form-2',
            headings: ['name', 'message'],
            key: 'data-source-key-2'
          })
        ])
      );

      expect(response.body.dataSources[0]).not.toHaveProperty('userId');
      expect(response.body.dataSources[0]).not.toHaveProperty('updatedAt');
      expect(response.body.dataSources[0]).not.toHaveProperty('__v');
    } finally {
      await DataSource.deleteMany({
        userId: user._id.toString()
      });
      await User.deleteOne({ _id: user._id });
    }
  }, 15000);
});
