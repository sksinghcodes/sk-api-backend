import request from 'supertest';
import app from '../../app';
import User from '../../models/user';

describe('GET /api/user/check-unique', () => {
  it('should reject when no field is provided', async () => {
    const response = await request(app).get('/api/user/check-unique');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Invalid field');
  });

  it('should return true when the email is unique', async () => {
    const response = await request(app)
      .get('/api/user/check-unique')
      .query({ email: 'test-nonexistent@example.com' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.isUnique).toBe(true);
  });

  it('should return false when the username already exists', async () => {
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    });

    try {
      const response = await request(app)
        .get('/api/user/check-unique')
        .query({ username: 'testuser' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.isUnique).toBe(false);
    } finally {
      await User.deleteOne({ _id: user._id });
    }
  });

  it('should return true when the username is unique', async () => {
    const response = await request(app)
      .get('/api/user/check-unique')
      .query({ username: 'nonexistent-user' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.isUnique).toBe(true);
  });

  it('should reject an invalid field', async () => {
    const response = await request(app)
      .get('/api/user/check-unique')
      .query({ phone: '1234567890' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Invalid field');
  });

  it('should check both email and username when both are provided', async () => {
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    });

    try {
      const response = await request(app).get('/api/user/check-unique').query({
        email: 'test@example.com',
        username: 'testuser'
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.isUnique).toBe(false);
    } finally {
      await User.deleteOne({ _id: user._id });
    }
  });

  it('should return true when email and username do not belong to the same user', async () => {
    const emailUser = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    });

    try {
      const response = await request(app).get('/api/user/check-unique').query({
        email: 'test@example.com',
        username: 'differentuser'
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.isUnique).toBe(true);
    } finally {
      await User.deleteOne({ _id: emailUser._id });
    }
  });
});
