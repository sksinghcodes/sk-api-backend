import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../../app';
import ConfirmationCode, { Purpose } from '../../models/confirmationCode';
import User from '../../models/user';

describe('POST /api/user/verify-profile', () => {
  it('should verify an unverified user with a valid verification code', async () => {
    const user = await User.create({
      username: 'verifyprofileuser',
      email: 'verifyprofile@example.com',
      password: 'Password123!',
      isVerified: false
    });

    const confirmationCode = await ConfirmationCode.create({
      userId: user._id,
      purpose: Purpose.PROFILE_VERIFICATION,
      expirationDate: new Date(Date.now() + 10 * 60 * 1000),
      code: '123456'
    });

    try {
      const response = await request(app)
        .post('/api/user/verify-profile')
        .send({
          verificationId: confirmationCode._id,
          code: '123456'
        });

      expect(response.status).toBe(200);

      expect(response.body).toEqual({
        success: true
      });

      const updatedUser = await User.findById(user._id);

      expect(updatedUser.isVerified).toBe(true);

      const deletedConfirmationCode = await ConfirmationCode.findById(
        confirmationCode._id
      );

      expect(deletedConfirmationCode).toBeNull();
    } finally {
      await ConfirmationCode.deleteOne({ _id: confirmationCode._id });
      await User.deleteOne({ _id: user._id });
    }
  }, 15000);

  it('should verify an unverified user with a numeric verification code', async () => {
    const user = await User.create({
      username: 'verifyprofilenumeric',
      email: 'verifyprofilenumeric@example.com',
      password: 'Password123!',
      isVerified: false
    });

    const confirmationCode = await ConfirmationCode.create({
      userId: user._id,
      purpose: Purpose.PROFILE_VERIFICATION,
      expirationDate: new Date(Date.now() + 10 * 60 * 1000),
      code: '123456'
    });

    try {
      const response = await request(app)
        .post('/api/user/verify-profile')
        .send({
          verificationId: confirmationCode._id,
          code: 123456
        });

      expect(response.status).toBe(200);

      expect(response.body).toEqual({
        success: true
      });

      const updatedUser = await User.findById(user._id);

      expect(updatedUser.isVerified).toBe(true);

      const deletedConfirmationCode = await ConfirmationCode.findById(
        confirmationCode._id
      );

      expect(deletedConfirmationCode).toBeNull();
    } finally {
      await ConfirmationCode.deleteOne({ _id: confirmationCode._id });
      await User.deleteOne({ _id: user._id });
    }
  }, 15000);

  it('should verify an already verified user', async () => {
    const user = await User.create({
      username: 'alreadyverifieduser',
      email: 'alreadyverified@example.com',
      password: 'Password123!',
      isVerified: true
    });

    const confirmationCode = await ConfirmationCode.create({
      userId: user._id,
      purpose: Purpose.PROFILE_VERIFICATION,
      expirationDate: new Date(Date.now() + 10 * 60 * 1000),
      code: '123456'
    });

    try {
      const response = await request(app)
        .post('/api/user/verify-profile')
        .send({
          verificationId: confirmationCode._id,
          code: '123456'
        });

      expect(response.status).toBe(200);

      expect(response.body).toEqual({
        success: true
      });

      const updatedUser = await User.findById(user._id);

      expect(updatedUser.isVerified).toBe(true);

      const deletedConfirmationCode = await ConfirmationCode.findById(
        confirmationCode._id
      );

      expect(deletedConfirmationCode).toBeNull();
    } finally {
      await ConfirmationCode.deleteOne({ _id: confirmationCode._id });
      await User.deleteOne({ _id: user._id });
    }
  }, 15000);

  it('should verify a user with a valid code close to expiration', async () => {
    const user = await User.create({
      username: 'nearverificationexpiry',
      email: 'nearverificationexpiry@example.com',
      password: 'Password123!',
      isVerified: false
    });

    const confirmationCode = await ConfirmationCode.create({
      userId: user._id,
      purpose: Purpose.PROFILE_VERIFICATION,
      expirationDate: new Date(Date.now() + 60 * 1000),
      code: '123456'
    });

    try {
      const response = await request(app)
        .post('/api/user/verify-profile')
        .send({
          verificationId: confirmationCode._id,
          code: '123456'
        });

      expect(response.status).toBe(200);

      expect(response.body).toEqual({
        success: true
      });

      const updatedUser = await User.findById(user._id);

      expect(updatedUser.isVerified).toBe(true);

      const deletedConfirmationCode = await ConfirmationCode.findById(
        confirmationCode._id
      );

      expect(deletedConfirmationCode).toBeNull();
    } finally {
      await ConfirmationCode.deleteOne({ _id: confirmationCode._id });
      await User.deleteOne({ _id: user._id });
    }
  }, 15000);
});
