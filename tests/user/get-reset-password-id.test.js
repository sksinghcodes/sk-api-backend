import { afterEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import app from '../../app';
import User from '../../models/user';
import ConfirmationCode, { Purpose } from '../../models/confirmationCode';
import sendMail from '../../email/sendMail';

vi.mock('../../email/sendMail', () => ({
  default: vi.fn().mockResolvedValue({})
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/user/get-password-reset-id', () => {
  it('should create a password reset code for an existing user', async () => {
    const user = await User.create({
      username: 'passwordresetuser',
      email: 'passwordreset@example.com',
      password: 'Password123!',
      isVerified: true
    });

    let confirmationCodeId;

    try {
      const response = await request(app)
        .get('/api/user/reset-password')
        .query({
          email: user.email
        });

      expect(response.status).toBe(200);

      expect(response.body.success).toBe(true);
      expect(response.body.passwordResetId).toBeDefined();

      confirmationCodeId = response.body.passwordResetId;

      const confirmationCode =
        await ConfirmationCode.findById(confirmationCodeId);

      expect(confirmationCode).not.toBeNull();
      expect(confirmationCode.userId).toBe(user._id.toString());
      expect(confirmationCode.purpose).toBe(Purpose.PASSWORD_RESET);
      expect(confirmationCode.expirationDate.getTime()).toBeGreaterThan(
        Date.now()
      );
      expect(confirmationCode.expirationDate.getTime()).toBeLessThanOrEqual(
        Date.now() + 10 * 60 * 1000
      );
      expect(confirmationCode.code).toMatch(/^\d{6}$/);

      expect(sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          receivers: [user.email],
          subject: 'Code for resetting password'
        })
      );

      expect(sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringContaining(confirmationCode.code),
          html: expect.stringContaining(confirmationCode.code)
        })
      );
    } finally {
      if (confirmationCodeId) {
        await ConfirmationCode.deleteOne({ _id: confirmationCodeId });
      }

      await User.deleteOne({ _id: user._id });
    }
  });

  it('should reject the request when email is missing', async () => {
    const response = await request(app).get('/api/user/reset-password');

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      success: false,
      error: 'Please enter email'
    });
  });

  it('should reject the request when email is empty', async () => {
    const response = await request(app)
      .get('/api/user/reset-password')
      .query({ email: '' });

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      success: false,
      error: 'Please enter email'
    });
  });

  it('should reject the request when email contains only spaces', async () => {
    const response = await request(app)
      .get('/api/user/reset-password')
      .query({ email: '   ' });

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      success: false,
      error: 'Please enter email'
    });
  });

  it('should reject an email that is not used in any profile', async () => {
    const response = await request(app)
      .get('/api/user/reset-password')
      .query({ email: 'nonexistent@example.com' });

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      success: false,
      error: 'This email address is not used in any profile'
    });
  });

  it('should reject an uppercase email when the stored email is lowercase', async () => {
    const user = await User.create({
      username: 'resetcaseuser',
      email: 'resetcase@example.com',
      password: 'Password123!'
    });

    try {
      const response = await request(app)
        .get('/api/user/reset-password')
        .query({
          email: 'RESETCASE@EXAMPLE.COM'
        });

      expect(response.status).toBe(200);

      expect(response.body).toEqual({
        success: false,
        error: 'This email address is not used in any profile'
      });
    } finally {
      await User.deleteOne({ _id: user._id });
    }
  });

  it('should accept an email with leading and trailing spaces', async () => {
    const user = await User.create({
      username: 'resetspaceuser',
      email: 'resetspace@example.com',
      password: 'Password123!'
    });

    let confirmationCodeId;

    try {
      const response = await request(app)
        .get('/api/user/reset-password')
        .query({
          email: ' resetspace@example.com '
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.passwordResetId).toBeDefined();

      confirmationCodeId = response.body.passwordResetId;
    } finally {
      if (confirmationCodeId) {
        await ConfirmationCode.deleteOne({ _id: confirmationCodeId });
      }

      await User.deleteOne({ _id: user._id });
    }
  });

  it('should handle email sending failure', async () => {
    const user = await User.create({
      username: 'resetmailfailureuser',
      email: 'resetmailfailure@example.com',
      password: 'Password123!'
    });

    let confirmationCodeId;

    try {
      sendMail.mockRejectedValueOnce(new Error('Email service failed'));

      const response = await request(app)
        .get('/api/user/reset-password')
        .query({
          email: user.email
        });

      expect(response.status).toBe(200);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Email service failed');

      confirmationCodeId = await ConfirmationCode.findOne({
        userId: user._id,
        purpose: Purpose.PASSWORD_RESET
      }).then((code) => code?._id);
    } finally {
      if (confirmationCodeId) {
        await ConfirmationCode.deleteOne({ _id: confirmationCodeId });
      }

      await User.deleteOne({ _id: user._id });
    }
  });

  it('should handle confirmation code save failure', async () => {
    const user = await User.create({
      username: 'resetsavefailureuser',
      email: 'resetsavefailure@example.com',
      password: 'Password123!'
    });

    try {
      vi.spyOn(ConfirmationCode.prototype, 'save').mockRejectedValueOnce(
        new Error('Confirmation code save failed')
      );

      const response = await request(app)
        .get('/api/user/reset-password')
        .query({
          email: user.email
        });

      expect(response.status).toBe(200);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Confirmation code save failed');

      expect(sendMail).not.toHaveBeenCalled();
    } finally {
      vi.restoreAllMocks();
      await User.deleteOne({ _id: user._id });
    }
  });

  it('should allow password reset for an unverified user', async () => {
    const user = await User.create({
      username: 'unverifiedresetuser',
      email: 'unverifiedreset@example.com',
      password: 'Password123!',
      isVerified: false
    });

    let confirmationCodeId;

    try {
      const response = await request(app)
        .get('/api/user/reset-password')
        .query({
          email: user.email
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.passwordResetId).toBeDefined();

      confirmationCodeId = response.body.passwordResetId;
    } finally {
      if (confirmationCodeId) {
        await ConfirmationCode.deleteOne({ _id: confirmationCodeId });
      }

      await User.deleteOne({ _id: user._id });
    }
  });

  it('should create a new password reset code for each request', async () => {
    const user = await User.create({
      username: 'duplicateresetuser',
      email: 'duplicatereset@example.com',
      password: 'Password123!'
    });

    let firstConfirmationCodeId;
    let secondConfirmationCodeId;

    try {
      const firstResponse = await request(app)
        .get('/api/user/reset-password')
        .query({ email: user.email });

      expect(firstResponse.body.success).toBe(true);
      firstConfirmationCodeId = firstResponse.body.passwordResetId;

      const secondResponse = await request(app)
        .get('/api/user/reset-password')
        .query({ email: user.email });

      expect(secondResponse.body.success).toBe(true);
      secondConfirmationCodeId = secondResponse.body.passwordResetId;

      expect(secondConfirmationCodeId).not.toBe(firstConfirmationCodeId);
    } finally {
      if (firstConfirmationCodeId) {
        await ConfirmationCode.deleteOne({ _id: firstConfirmationCodeId });
      }

      if (secondConfirmationCodeId) {
        await ConfirmationCode.deleteOne({ _id: secondConfirmationCodeId });
      }

      await User.deleteOne({ _id: user._id });
    }
  });
});
