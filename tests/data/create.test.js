import { describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../app';
import User from '../../models/user';
import DataSource from '../../models/dataSource';
import Data from '../../models/data';

vi.mock('../../email/sendMail', () => ({
  default: vi.fn().mockResolvedValue({
    accepted: ['test@example.com']
  })
}));

describe('POST /api/data', () => {
  it('should create data and send the submission email', async () => {
    const user = await User.create({
      username: 'datauser',
      email: 'datauser@example.com',
      password: 'Password123!',
      role: 1
    });

    const dataSource = await DataSource.create({
      source: 'http://localhost:3000',
      headings: ['name', 'message'],
      key: 'test-data-source-key',
      userId: user._id.toString()
    });

    const authToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET_KEY
    );

    const dataSourceToken = jwt.sign(
      {
        dataSource: JSON.stringify(dataSource)
      },
      process.env.JWT_SECRET_KEY
    );

    try {
      const response = await request(app)
        .post('/api/data/')
        .set('Cookie', [`jwt-token=${authToken}`])
        .set('Origin', 'http://localhost:3000')
        .send({
          key: dataSourceToken,
          data: {
            name: 'John Doe',
            message: 'Hello'
          }
        });

      expect(response.status).toBe(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Your message was delivered'
      });

      const createdData = await Data.findOne({
        userId: user._id.toString(),
        dataSourceId: dataSource._id.toString()
      });

      expect(createdData).not.toBeNull();
      expect(createdData.name).toBe('John Doe');
      expect(createdData.message).toBe('Hello');
    } finally {
      await Data.deleteMany({
        userId: user._id.toString()
      });
      await DataSource.deleteOne({ _id: dataSource._id });
      await User.deleteOne({ _id: user._id });
    }
  }, 15000);
});
