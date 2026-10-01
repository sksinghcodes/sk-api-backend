import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../../app';
import User from '../../models/user';
import ConfirmationCode, { Purpose } from '../../models/confirmationCode';

describe('POST /api/user/reset-password', () => {
  it('should reset the password with a valid confirmation code', async () => {
    const user = await User.create({
      username: 'resetpassworduser',
      email: 'resetpassword@example.com',
      password: 'OldPassword123!',
      isVerified: false
    });

    const confirmationCode = await ConfirmationCode.create({
      userId: user._id,
      purpose: Purpose.PASSWORD_RESET,
      expirationDate: new Date(Date.now() + 10 * 60 * 1000),
      code: '123456'
    });

    try {
      const response = await request(app)
        .post('/api/user/reset-password')
        .send({
          passwordResetId: confirmationCode._id,
          code: '123456',
          newPassword: 'NewPassword123!'
        });

      expect(response.status).toBe(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Password reset successful'
      });

      const updatedUser = await User.findById(user._id);

      expect(updatedUser.isVerified).toBe(true);
      expect(await updatedUser.authenticate('NewPassword123!')).toBe(true);
      expect(await updatedUser.authenticate('OldPassword123!')).toBe(false);

      const deletedConfirmationCode = await ConfirmationCode.findById(
        confirmationCode._id
      );

      expect(deletedConfirmationCode).toBeNull();
    } finally {
      await ConfirmationCode.deleteOne({ _id: confirmationCode._id });
      await User.deleteOne({ _id: user._id });
    }
  }, 15000);

  it('should reject an incorrect confirmation code', async () => {
    const user = await User.create({
      username: 'wrongcodeuser',
      email: 'wrongcode@example.com',
      password: 'OldPassword123!',
      isVerified: false
    });

    const confirmationCode = await ConfirmationCode.create({
      userId: user._id,
      purpose: Purpose.PASSWORD_RESET,
      expirationDate: new Date(Date.now() + 10 * 60 * 1000),
      code: '123456'
    });

    try {
      const response = await request(app)
        .post('/api/user/reset-password')
        .send({
          passwordResetId: confirmationCode._id,
          code: '654321',
          newPassword: 'NewPassword123!'
        });

      expect(response.status).toBe(200);

      expect(response.body).toEqual({
        success: false,
        error: 'Confirmation code incorrect'
      });

      const unchangedUser = await User.findById(user._id);

      expect(await unchangedUser.authenticate('OldPassword123!')).toBe(true);
      expect(unchangedUser.isVerified).toBe(false);

      const existingConfirmationCode = await ConfirmationCode.findById(
        confirmationCode._id
      );

      expect(existingConfirmationCode).not.toBeNull();
    } finally {
      await ConfirmationCode.deleteOne({ _id: confirmationCode._id });
      await User.deleteOne({ _id: user._id });
    }
  });

  it('should reject an expired confirmation code', async () => {
    const user = await User.create({
      username: 'expiredcodeuser',
      email: 'expiredcode@example.com',
      password: 'OldPassword123!',
      isVerified: false
    });

    const confirmationCode = await ConfirmationCode.create({
      userId: user._id,
      purpose: Purpose.PASSWORD_RESET,
      expirationDate: new Date(Date.now() - 10 * 60 * 1000),
      code: '123456'
    });

    try {
      const response = await request(app)
        .post('/api/user/reset-password')
        .send({
          passwordResetId: confirmationCode._id,
          code: '123456',
          newPassword: 'NewPassword123!'
        });

      expect(response.status).toBe(200);

      expect(response.body).toEqual({
        success: false,
        error: 'Profile verification code expired'
      });

      const unchangedUser = await User.findById(user._id);

      expect(await unchangedUser.authenticate('OldPassword123!')).toBe(true);
      expect(unchangedUser.isVerified).toBe(false);

      const existingConfirmationCode = await ConfirmationCode.findById(
        confirmationCode._id
      );

      expect(existingConfirmationCode).not.toBeNull();
    } finally {
      await ConfirmationCode.deleteOne({ _id: confirmationCode._id });
      await User.deleteOne({ _id: user._id });
    }
  }, 15000);

  it('should reset the password for an already verified user', async () => {
    const user = await User.create({
      username: 'verifiedresetuser',
      email: 'verifiedreset@example.com',
      password: 'OldPassword123!',
      isVerified: true
    });

    const confirmationCode = await ConfirmationCode.create({
      userId: user._id,
      purpose: Purpose.PASSWORD_RESET,
      expirationDate: new Date(Date.now() + 10 * 60 * 1000),
      code: '123456'
    });

    try {
      const response = await request(app)
        .post('/api/user/reset-password')
        .send({
          passwordResetId: confirmationCode._id,
          code: '123456',
          newPassword: 'NewPassword123!'
        });

      expect(response.status).toBe(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Password reset successful'
      });

      const updatedUser = await User.findById(user._id);

      expect(updatedUser.isVerified).toBe(true);
      expect(await updatedUser.authenticate('NewPassword123!')).toBe(true);
      expect(await updatedUser.authenticate('OldPassword123!')).toBe(false);

      const deletedConfirmationCode = await ConfirmationCode.findById(
        confirmationCode._id
      );

      expect(deletedConfirmationCode).toBeNull();
    } finally {
      await ConfirmationCode.deleteOne({ _id: confirmationCode._id });
      await User.deleteOne({ _id: user._id });
    }
  }, 15000);

  it('should reset the password to a new valid password', async () => {
    const user = await User.create({
      username: 'newpassworduser',
      email: 'newpassword@example.com',
      password: 'OldPassword123!',
      isVerified: true
    });

    const confirmationCode = await ConfirmationCode.create({
      userId: user._id,
      purpose: Purpose.PASSWORD_RESET,
      expirationDate: new Date(Date.now() + 10 * 60 * 1000),
      code: '654321'
    });

    try {
      const response = await request(app)
        .post('/api/user/reset-password')
        .send({
          passwordResetId: confirmationCode._id,
          code: '654321',
          newPassword: 'MyNewSecurePassword123!'
        });

      expect(response.status).toBe(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Password reset successful'
      });

      const updatedUser = await User.findById(user._id);

      expect(await updatedUser.authenticate('MyNewSecurePassword123!')).toBe(
        true
      );
    } finally {
      await ConfirmationCode.deleteOne({ _id: confirmationCode._id });
      await User.deleteOne({ _id: user._id });
    }
  }, 15000);
});
