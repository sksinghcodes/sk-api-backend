import { vi } from 'vitest';
vi.mock('../../email/sendMail', () => ({
  default: vi.fn().mockResolvedValue({})
}));
import request from 'supertest';
import app from '../../app';
import User from '../../models/user';
import ConfirmationCode, { Purpose } from '../../models/confirmationCode';
import sendMail from '../../email/sendMail';

describe('POST /api/user/sign-up', () => {
  it('should create a user and confirmation code', async () => {
    let user;
    let confirmationCodeId;

    try {
      const response = await request(app).post('/api/user/sign-up').send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!'
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.confirmationCodeId).toBeDefined();

      confirmationCodeId = response.body.confirmationCodeId;

      user = await User.findOne({ email: 'test@example.com' });

      expect(user).not.toBeNull();
      expect(user.username).toBe('testuser');

      const confirmationCode =
        await ConfirmationCode.findById(confirmationCodeId);

      expect(confirmationCode).not.toBeNull();
      expect(confirmationCode.userId.toString()).toBe(user._id.toString());
      expect(confirmationCode.purpose).toBe(Purpose.PROFILE_VERIFICATION);
    } finally {
      if (confirmationCodeId) {
        await ConfirmationCode.deleteOne({ _id: confirmationCodeId });
      }

      if (user) {
        await User.deleteOne({ _id: user._id });
      }
    }
  }, 10000);

  it('should reject when the username already exists', async () => {
    const user = await User.create({
      username: 'testuser',
      email: 'existing@example.com',
      password: 'Password123!'
    });

    try {
      const response = await request(app).post('/api/user/sign-up').send({
        username: 'testuser',
        email: 'new@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!'
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(false);
      expect(response.body.validation.username.isUnique).toBe(false);
    } finally {
      await User.deleteOne({ _id: user._id });
    }
  });

  it('should reject when the email already exists', async () => {
    const user = await User.create({
      username: 'existinguser',
      email: 'test@example.com',
      password: 'Password123!'
    });

    try {
      const response = await request(app).post('/api/user/sign-up').send({
        username: 'newuser',
        email: 'test@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!'
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(false);
      expect(response.body.validation.email.isUnique).toBe(false);
    } finally {
      await User.deleteOne({ _id: user._id });
    }
  });

  it('should reject an invalid username', async () => {
    const response = await request(app).post('/api/user/sign-up').send({
      username: 'a',
      email: 'new@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!'
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(false);
    expect(response.body.validation.username.isValid).toBe(false);
  });

  it('should reject an invalid email', async () => {
    const response = await request(app).post('/api/user/sign-up').send({
      username: 'newuser',
      email: 'invalid-email',
      password: 'Password123!',
      confirmPassword: 'Password123!'
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(false);
    expect(response.body.validation.email.isValid).toBe(false);
  });

  it('should reject an invalid password', async () => {
    const response = await request(app).post('/api/user/sign-up').send({
      username: 'newuser',
      email: 'new@example.com',
      password: 'password',
      confirmPassword: 'password'
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(false);
    expect(response.body.validation.password.isValid).toBe(false);
  });

  it('should reject when passwords do not match', async () => {
    const response = await request(app).post('/api/user/sign-up').send({
      username: 'newuser',
      email: 'new@example.com',
      password: 'Password123!',
      confirmPassword: 'Different123!'
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(false);
    expect(response.body.validation.confirmPassword.isValid).toBe(false);
  });

  it('should reject when username is missing', async () => {
    const response = await request(app).post('/api/user/sign-up').send({
      email: 'new@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!'
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(false);
    expect(response.body.validation.username.isValid).toBe(false);
  });

  it('should reject when email is missing', async () => {
    const response = await request(app).post('/api/user/sign-up').send({
      username: 'newuser',
      password: 'Password123!',
      confirmPassword: 'Password123!'
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(false);
    expect(response.body.validation.email.isValid).toBe(false);
  });

  it('should reject when password is missing', async () => {
    const response = await request(app).post('/api/user/sign-up').send({
      username: 'newuser',
      email: 'new@example.com',
      confirmPassword: 'Password123!'
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(false);
    expect(response.body.validation.password.isValid).toBe(false);
  });

  it('should reject when confirmPassword is missing', async () => {
    const response = await request(app).post('/api/user/sign-up').send({
      username: 'newuser',
      email: 'new@example.com',
      password: 'Password123!'
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(false);
    expect(response.body.validation.confirmPassword.isValid).toBe(false);
  });

  it('should reject a username containing spaces', async () => {
    const response = await request(app).post('/api/user/sign-up').send({
      username: 'new user',
      email: 'new@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!'
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(false);
    expect(response.body.validation.username.isValid).toBe(false);
  });

  it('should reject a username longer than 30 characters', async () => {
    const response = await request(app).post('/api/user/sign-up').send({
      username: 'abcdefghijklmnopqrstuvwxyz12345',
      email: 'new@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!'
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(false);
    expect(response.body.validation.username.isValid).toBe(false);
  });

  it('should reject a username shorter than 2 characters', async () => {
    const response = await request(app).post('/api/user/sign-up').send({
      username: 'a',
      email: 'new@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!'
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(false);
    expect(response.body.validation.username.isValid).toBe(false);
  });

  it('should reject a password shorter than 6 characters', async () => {
    const response = await request(app).post('/api/user/sign-up').send({
      username: 'newuser',
      email: 'new@example.com',
      password: 'A1!bc',
      confirmPassword: 'A1!bc'
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(false);
    expect(response.body.validation.password.isValid).toBe(false);
  });

  it('should reject a password longer than 30 characters', async () => {
    const response = await request(app).post('/api/user/sign-up').send({
      username: 'newuser',
      email: 'new@example.com',
      password: 'Password123!Password123!Password',
      confirmPassword: 'Password123!Password123!Password'
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(false);
    expect(response.body.validation.password.isValid).toBe(false);
  });

  it('should reject a password without an uppercase letter', async () => {
    const response = await request(app).post('/api/user/sign-up').send({
      username: 'newuser',
      email: 'new@example.com',
      password: 'password123!',
      confirmPassword: 'password123!'
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(false);
    expect(response.body.validation.password.isValid).toBe(false);
  });

  it('should reject a password without a lowercase letter', async () => {
    const response = await request(app).post('/api/user/sign-up').send({
      username: 'newuser',
      email: 'new@example.com',
      password: 'PASSWORD123!',
      confirmPassword: 'PASSWORD123!'
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(false);
    expect(response.body.validation.password.isValid).toBe(false);
  });

  it('should reject a password without a digit', async () => {
    const response = await request(app).post('/api/user/sign-up').send({
      username: 'newuser',
      email: 'new@example.com',
      password: 'Password!',
      confirmPassword: 'Password!'
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(false);
    expect(response.body.validation.password.isValid).toBe(false);
  });

  it('should reject a password without a special character', async () => {
    const response = await request(app).post('/api/user/sign-up').send({
      username: 'newuser',
      email: 'new@example.com',
      password: 'Password123',
      confirmPassword: 'Password123'
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(false);
    expect(response.body.validation.password.isValid).toBe(false);
  });

  it('should reject a password containing an invalid character', async () => {
    const response = await request(app).post('/api/user/sign-up').send({
      username: 'newuser',
      email: 'new@example.com',
      password: 'Password123/',
      confirmPassword: 'Password123/'
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(false);
    expect(response.body.validation.password.isValid).toBe(false);
  });

  it('should accept a valid password', async () => {
    let user;
    let confirmationCodeId;

    try {
      const response = await request(app).post('/api/user/sign-up').send({
        username: 'newvaliduser',
        email: 'newvalid@example.com',
        password: 'Password123@',
        confirmPassword: 'Password123@'
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.confirmationCodeId).toBeDefined();

      confirmationCodeId = response.body.confirmationCodeId;

      user = await User.findOne({ email: 'newvalid@example.com' });
    } finally {
      if (confirmationCodeId) {
        await ConfirmationCode.deleteOne({ _id: confirmationCodeId });
      }

      if (user) {
        await User.deleteOne({ _id: user._id });
      }
    }
  });

  it("should hash the user's password", async () => {
    let confirmationCodeId;

    try {
      const response = await request(app).post('/api/user/sign-up').send({
        username: 'passwordhashuser',
        email: 'passwordhash@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!'
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      confirmationCodeId = response.body.confirmationCodeId;

      const user = await User.findOne({ email: 'passwordhash@example.com' });

      expect(user).not.toBeNull();
      expect(user.password).not.toBe('Password123!');
      expect(user.password).toMatch(/^\$2[aby]\$/);
    } finally {
      if (confirmationCodeId) {
        await ConfirmationCode.deleteOne({ _id: confirmationCodeId });
      }

      await User.deleteOne({ email: 'passwordhash@example.com' });
    }
  });

  it('should create a user with the correct default values', async () => {
    let confirmationCodeId;

    try {
      const response = await request(app).post('/api/user/sign-up').send({
        username: 'defaultvaluesuser',
        email: 'defaultvalues@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!'
      });

      expect(response.body.success).toBe(true);

      confirmationCodeId = response.body.confirmationCodeId;

      const user = await User.findOne({
        email: 'defaultvalues@example.com'
      });

      expect(user).not.toBeNull();
      expect(user.isVerified).toBe(false);
      expect(user.role).toBe(1);
    } finally {
      if (confirmationCodeId) {
        await ConfirmationCode.deleteOne({ _id: confirmationCodeId });
      }

      await User.deleteOne({ email: 'defaultvalues@example.com' });
    }
  });

  it('should send the profile verification email', async () => {
    let confirmationCodeId;

    try {
      const response = await request(app).post('/api/user/sign-up').send({
        username: 'emailtestuser',
        email: 'emailtest@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!'
      });

      expect(response.body.success).toBe(true);

      confirmationCodeId = response.body.confirmationCodeId;

      expect(sendMail).toHaveBeenCalledTimes(1);
      expect(sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          receivers: ['emailtest@example.com'],
          subject: 'Profile verification code',
          text: expect.stringContaining('Your profile verification code is'),
          html: expect.stringContaining('Your profile verification code is')
        })
      );
    } finally {
      if (confirmationCodeId) {
        await ConfirmationCode.deleteOne({ _id: confirmationCodeId });
      }

      await User.deleteOne({ email: 'emailtest@example.com' });

      vi.clearAllMocks();
    }
  });

  it('should set the confirmation code expiration to approximately 10 minutes', async () => {
    let confirmationCodeId;

    const beforeRequest = Date.now();

    try {
      const response = await request(app).post('/api/user/sign-up').send({
        username: 'expirationuser',
        email: 'expiration@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!'
      });

      expect(response.body.success).toBe(true);

      confirmationCodeId = response.body.confirmationCodeId;

      const confirmationCode =
        await ConfirmationCode.findById(confirmationCodeId);

      expect(confirmationCode).not.toBeNull();

      const expirationTime = confirmationCode.expirationDate.getTime();
      const tenMinutes = 10 * 60 * 1000;

      expect(expirationTime).toBeGreaterThanOrEqual(
        beforeRequest + tenMinutes - 1000
      );
      expect(expirationTime).toBeLessThanOrEqual(
        Date.now() + tenMinutes + 1000
      );
    } finally {
      if (confirmationCodeId) {
        await ConfirmationCode.deleteOne({ _id: confirmationCodeId });
      }

      await User.deleteOne({ email: 'expiration@example.com' });
    }
  });

  it('should generate a 6-digit confirmation code', async () => {
    let confirmationCodeId;

    try {
      const response = await request(app).post('/api/user/sign-up').send({
        username: 'codetestuser',
        email: 'codetest@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!'
      });

      expect(response.body.success).toBe(true);

      confirmationCodeId = response.body.confirmationCodeId;

      const confirmationCode =
        await ConfirmationCode.findById(confirmationCodeId);

      expect(confirmationCode).not.toBeNull();
      expect(confirmationCode.code).toMatch(/^\d{6}$/);
    } finally {
      if (confirmationCodeId) {
        await ConfirmationCode.deleteOne({ _id: confirmationCodeId });
      }

      await User.deleteOne({ email: 'codetest@example.com' });
    }
  });

  it('should associate the confirmation code with the created user', async () => {
    let user;
    let confirmationCodeId;

    try {
      const response = await request(app).post('/api/user/sign-up').send({
        username: 'codeuser',
        email: 'codeuser@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!'
      });

      expect(response.body.success).toBe(true);

      confirmationCodeId = response.body.confirmationCodeId;

      user = await User.findOne({ email: 'codeuser@example.com' });
      const confirmationCode =
        await ConfirmationCode.findById(confirmationCodeId);

      expect(user).not.toBeNull();
      expect(confirmationCode).not.toBeNull();
      expect(confirmationCode.userId).toBe(user._id.toString());
    } finally {
      if (confirmationCodeId) {
        await ConfirmationCode.deleteOne({ _id: confirmationCodeId });
      }

      if (user) {
        await User.deleteOne({ _id: user._id });
      }
    }
  });

  it('should return an error when sending the verification email fails', async () => {
    let user;
    let confirmationCodeId;

    sendMail.mockRejectedValueOnce(new Error('Email sending failed'));

    try {
      const response = await request(app).post('/api/user/sign-up').send({
        username: 'emailfailureuser',
        email: 'emailfailure@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!'
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Email sending failed');

      user = await User.findOne({ email: 'emailfailure@example.com' });

      const confirmationCode = await ConfirmationCode.findOne({
        userId: user?._id.toString()
      });

      if (confirmationCode) {
        confirmationCodeId = confirmationCode._id;
      }
    } finally {
      if (confirmationCodeId) {
        await ConfirmationCode.deleteOne({ _id: confirmationCodeId });
      }

      await User.deleteOne({ email: 'emailfailure@example.com' });
    }
  });
});
