import { describe, expect, it } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../app';
import User from '../../models/user';
import DataSource from '../../models/dataSource';

describe('POST /api/data-source/', () => {
  it('should create a new data source', async () => {
    const user = await User.create({
      username: 'createdatasourceuser',
      email: 'createdatasource@example.com',
      password: 'Password123!',
      role: 1
    });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY);

    try {
      const response = await request(app)
        .post('/api/data-source/')
        .set('Cookie', [`jwt-token=${token}`])
        .send({
          source: 'https://example.com',
          headings: ['name', 'email']
        });

      expect(response.status).toBe(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('New data-source added');

      expect(response.body.dataSources).toHaveLength(1);

      const dataSource = response.body.dataSources[0];

      expect(dataSource.source).toBe('https://example.com');
      expect(dataSource.headings).toEqual(['name', 'email']);
      expect(dataSource.key).toEqual(expect.any(String));

      expect(dataSource).not.toHaveProperty('userId');
      expect(dataSource).not.toHaveProperty('updatedAt');
      expect(dataSource).not.toHaveProperty('__v');

      const savedDataSource = await DataSource.findOne({
        userId: user._id.toString()
      });

      expect(savedDataSource).not.toBeNull();
      expect(savedDataSource.source).toBe('https://example.com');
      expect(savedDataSource.headings).toEqual(['name', 'email']);
      expect(savedDataSource.key).toEqual(expect.any(String));
    } finally {
      await DataSource.deleteMany({
        userId: user._id.toString()
      });
      await User.deleteOne({ _id: user._id });
    }
  }, 15000);
});
