import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../../app';
import User from '../../models/user';
import jwt from 'jsonwebtoken';

describe('POST /api/user/sign-out', () => {
  it('should sign out the user and clear the jwt-token cookie', async () => {
    const user = await User.create({
      username: 'signoutuser',
      email: 'signout@example.com',
      password: 'Password123!',
      role: 1
    });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY);

    try {
      const response = await request(app)
        .post('/api/user/sign-out')
        .set('Cookie', [`jwt-token=${token}`]);

      expect(response.status).toBe(200);

      expect(response.body).toEqual({
        success: true,
        message: 'User sign out was successful'
      });

      expect(response.headers['set-cookie']).toEqual(
        expect.arrayContaining([
          expect.stringMatching(
            /^jwt-token=;.*Expires=Thu, 01 Jan 1970 00:00:00 GMT/i
          )
        ])
      );
    } finally {
      await User.deleteOne({ _id: user._id });
    }
  }, 15000);
});
