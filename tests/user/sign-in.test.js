import { describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import app from '../../app';
import User from '../../models/user';
import ConfirmationCode, { Purpose } from '../../models/confirmationCode';
import sendMail from '../../email/sendMail';

vi.mock('../../email/sendMail', () => ({
  default: vi.fn().mockResolvedValue({})
}));

describe('POST /api/user/sign-in', () => {
  it('should reject invalid credentials', async () => {
    const response = await request(app).post('/api/user/sign-in').send({
      usernameOrEmail: 'nonexistentuser',
      password: 'Password123!'
    });

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      success: false,
      error: 'Invalid credentials'
    });
  });

  it('should reject an incorrect password', async () => {
    const user = await User.create({
      username: 'signinuser',
      email: 'signin@example.com',
      password: 'Password123!',
      isVerified: true
    });

    try {
      const response = await request(app).post('/api/user/sign-in').send({
        usernameOrEmail: 'signinuser',
        password: 'WrongPassword123!'
      });

      expect(response.status).toBe(200);

      expect(response.body).toEqual({
        success: false,
        error: 'Invalid credentials'
      });
    } finally {
      await User.deleteOne({ _id: user._id });
    }
  });

  it('should sign in with email and correct credentials', async () => {
    const user = await User.create({
      username: 'signinemailuser',
      email: 'signinemail@example.com',
      password: 'Password123!',
      isVerified: true
    });

    try {
      const response = await request(app).post('/api/user/sign-in').send({
        usernameOrEmail: 'signinemail@example.com',
        password: 'Password123!'
      });

      expect(response.status).toBe(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Login Successful'
      });
    } finally {
      await User.deleteOne({ _id: user._id });
    }
  });

  it('should set the authentication cookie on successful sign-in', async () => {
    const user = await User.create({
      username: 'signincookieuser',
      email: 'signincookie@example.com',
      password: 'Password123!',
      isVerified: true
    });

    try {
      const response = await request(app).post('/api/user/sign-in').send({
        usernameOrEmail: 'signincookie@example.com',
        password: 'Password123!'
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.headers['set-cookie'].length).toBeGreaterThan(0);
    } finally {
      await User.deleteOne({ _id: user._id });
    }
  });

  it('should sign in with username and correct credentials', async () => {
    const user = await User.create({
      username: 'signinusername',
      email: 'signinusername@example.com',
      password: 'Password123!',
      isVerified: true
    });

    try {
      const response = await request(app).post('/api/user/sign-in').send({
        usernameOrEmail: 'signinusername',
        password: 'Password123!'
      });

      expect(response.status).toBe(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Login Successful'
      });
    } finally {
      await User.deleteOne({ _id: user._id });
    }
  });

  it('should send a new confirmation code when the user is not verified', async () => {
    const user = await User.create({
      username: 'unverifieduser',
      email: 'unverified@example.com',
      password: 'Password123!',
      isVerified: false
    });

    let confirmationCodeId;

    try {
      const response = await request(app).post('/api/user/sign-in').send({
        usernameOrEmail: 'unverifieduser',
        password: 'Password123!'
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.confirmationCodeId).toBeDefined();

      confirmationCodeId = response.body.confirmationCodeId;

      const confirmationCode =
        await ConfirmationCode.findById(confirmationCodeId);

      expect(confirmationCode).not.toBeNull();
      expect(confirmationCode.userId).toBe(user._id.toString());
      expect(confirmationCode.purpose).toBe(Purpose.PROFILE_VERIFICATION);

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

  it('should reject an incorrect password for an unverified user', async () => {
    const user = await User.create({
      username: 'unverifiedwrongpassword',
      email: 'unverifiedwrongpassword@example.com',
      password: 'Password123!',
      isVerified: false
    });

    try {
      const response = await request(app).post('/api/user/sign-in').send({
        usernameOrEmail: 'unverifiedwrongpassword',
        password: 'WrongPassword123!'
      });

      expect(response.status).toBe(200);

      expect(response.body).toEqual({
        success: false,
        error: 'Invalid credentials'
      });
    } finally {
      await User.deleteOne({ _id: user._id });
    }
  });

  it('should reject sign-in when usernameOrEmail is missing', async () => {
    const response = await request(app).post('/api/user/sign-in').send({
      password: 'Password123!'
    });

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      success: false,
      validation: {
        usernameOrEmail: {
          errorMessage: 'This field is required',
          isValid: false
        },
        password: {
          errorMessage: '',
          isValid: true
        }
      },
      values: {
        password: 'Password123!'
      }
    });
  });

  it('should reject sign-in when password is missing', async () => {
    const response = await request(app).post('/api/user/sign-in').send({
      usernameOrEmail: 'signinuser'
    });

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      success: false,
      validation: {
        usernameOrEmail: {
          errorMessage: '',
          isValid: true
        },
        password: {
          errorMessage: 'This field is required',
          isValid: false
        }
      },
      values: {
        usernameOrEmail: 'signinuser'
      }
    });
  });

  it('should reject sign-in when usernameOrEmail and password are missing', async () => {
    const response = await request(app).post('/api/user/sign-in').send({});

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      success: false,
      validation: {
        usernameOrEmail: {
          errorMessage: 'This field is required',
          isValid: false
        },
        password: {
          errorMessage: 'This field is required',
          isValid: false
        }
      },
      values: {}
    });
  });

  it('should reject sign-in when usernameOrEmail and password are empty', async () => {
    const response = await request(app).post('/api/user/sign-in').send({
      usernameOrEmail: '',
      password: ''
    });

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      success: false,
      validation: {
        usernameOrEmail: {
          errorMessage: 'This field is required',
          isValid: false
        },
        password: {
          errorMessage: 'This field is required',
          isValid: false
        }
      },
      values: {
        usernameOrEmail: '',
        password: ''
      }
    });
  });

  it('should reject sign-in when usernameOrEmail and password contain only spaces', async () => {
    const response = await request(app).post('/api/user/sign-in').send({
      usernameOrEmail: '   ',
      password: '   '
    });

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      success: false,
      validation: {
        usernameOrEmail: {
          errorMessage: 'This field is required',
          isValid: false
        },
        password: {
          errorMessage: 'This field is required',
          isValid: false
        }
      },
      values: {
        usernameOrEmail: '   ',
        password: '   '
      }
    });
  });

  it('should reject a non-existent email', async () => {
    const response = await request(app).post('/api/user/sign-in').send({
      usernameOrEmail: 'nonexistent@example.com',
      password: 'Password123!'
    });

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      success: false,
      error: 'Invalid credentials'
    });
  });

  it('should reject an incorrect password when signing in with email', async () => {
    const user = await User.create({
      username: 'signinwrongemailpassword',
      email: 'signinwrongemailpassword@example.com',
      password: 'Password123!',
      isVerified: true
    });

    try {
      const response = await request(app).post('/api/user/sign-in').send({
        usernameOrEmail: 'signinwrongemailpassword@example.com',
        password: 'WrongPassword123!'
      });

      expect(response.status).toBe(200);

      expect(response.body).toEqual({
        success: false,
        error: 'Invalid credentials'
      });
    } finally {
      await User.deleteOne({ _id: user._id });
    }
  });

  it('should send a confirmation code when an unverified user signs in with email', async () => {
    const user = await User.create({
      username: 'unverifiedemailuser',
      email: 'unverifiedemail@example.com',
      password: 'Password123!',
      isVerified: false
    });

    let confirmationCodeId;

    try {
      const response = await request(app).post('/api/user/sign-in').send({
        usernameOrEmail: 'unverifiedemail@example.com',
        password: 'Password123!'
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.confirmationCodeId).toBeDefined();

      confirmationCodeId = response.body.confirmationCodeId;

      const confirmationCode =
        await ConfirmationCode.findById(confirmationCodeId);

      expect(confirmationCode).not.toBeNull();
      expect(confirmationCode.userId).toBe(user._id.toString());
      expect(confirmationCode.purpose).toBe(Purpose.PROFILE_VERIFICATION);
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
          subject: 'Profile verification code'
        })
      );
    } finally {
      if (confirmationCodeId) {
        await ConfirmationCode.deleteOne({ _id: confirmationCodeId });
      }

      await User.deleteOne({ _id: user._id });
    }
  });

  it('should return an error when sending the confirmation email fails', async () => {
    const user = await User.create({
      username: 'unverifiedemailfailure',
      email: 'unverifiedemailfailure@example.com',
      password: 'Password123!',
      isVerified: false
    });
    let confirmationCodeId;
    sendMail.mockRejectedValueOnce(new Error('Email sending failed'));
    try {
      const response = await request(app).post('/api/user/sign-in').send({
        usernameOrEmail: 'unverifiedemailfailure',
        password: 'Password123!'
      });
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: false,
        error: 'Email sending failed'
      });
      const confirmationCode = await ConfirmationCode.findOne({
        userId: user._id
      });
      expect(confirmationCode).not.toBeNull();
      confirmationCodeId = confirmationCode._id;
    } finally {
      if (confirmationCodeId) {
        await ConfirmationCode.deleteOne({ _id: confirmationCodeId });
      }
      await User.deleteOne({ _id: user._id });
    }
  });

  it('should return an error when saving the confirmation code fails', async () => {
    vi.clearAllMocks();
    const user = await User.create({
      username: 'confirmcodesavefailure',
      email: 'confirmcodesavefailure@example.com',
      password: 'Password123!',
      isVerified: false
    });

    const saveSpy = vi
      .spyOn(ConfirmationCode.prototype, 'save')
      .mockRejectedValueOnce(new Error('Confirmation code save failed'));

    try {
      const response = await request(app).post('/api/user/sign-in').send({
        usernameOrEmail: 'confirmcodesavefailure',
        password: 'Password123!'
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: false,
        error: 'Confirmation code save failed'
      });
      const confirmationCode = await ConfirmationCode.findOne({
        userId: user._id
      });

      expect(confirmationCode).toBeNull();
      expect(sendMail).not.toHaveBeenCalled();
    } finally {
      saveSpy.mockRestore();
      await User.deleteOne({ _id: user._id });
    }
  });

  it('should reject sign-in when usernameOrEmail is not a string', async () => {
    const response = await request(app).post('/api/user/sign-in').send({
      usernameOrEmail: 12345,
      password: 'Password123!'
    });

    expect(response.status).toBe(200);
  });

  it('should reject sign-in when password is not a string', async () => {
    const response = await request(app).post('/api/user/sign-in').send({
      usernameOrEmail: 'someuser',
      password: 12345
    });

    expect(response.status).toBe(200);
  });

  it('should reject sign-in when usernameOrEmail is an object', async () => {
    const response = await request(app).post('/api/user/sign-in').send({
      usernameOrEmail: {},
      password: 'Password123!'
    });

    expect(response.status).toBe(200);
  });

  it('should reject sign-in when password is an object', async () => {
    const response = await request(app).post('/api/user/sign-in').send({
      usernameOrEmail: 'someuser',
      password: {}
    });

    expect(response.status).toBe(200);
  });

  it('should reject sign-in when usernameOrEmail is an array', async () => {
    const response = await request(app).post('/api/user/sign-in').send({
      usernameOrEmail: [],
      password: 'Password123!'
    });

    expect(response.status).toBe(200);
  });

  it('should reject sign-in when password is an array', async () => {
    const response = await request(app).post('/api/user/sign-in').send({
      usernameOrEmail: 'someuser',
      password: []
    });

    expect(response.status).toBe(200);
  });

  it('should reject sign-in when usernameOrEmail is null', async () => {
    const response = await request(app).post('/api/user/sign-in').send({
      usernameOrEmail: null,
      password: 'Password123!'
    });

    expect(response.status).toBe(200);
  });

  it('should reject sign-in when password is null', async () => {
    const response = await request(app).post('/api/user/sign-in').send({
      usernameOrEmail: 'someuser',
      password: null
    });

    expect(response.status).toBe(200);
  });

  it('should reject sign-in when usernameOrEmail is a boolean', async () => {
    const response = await request(app).post('/api/user/sign-in').send({
      usernameOrEmail: true,
      password: 'Password123!'
    });

    expect(response.status).toBe(200);
  });

  it('should reject sign-in when password is a boolean', async () => {
    const response = await request(app).post('/api/user/sign-in').send({
      usernameOrEmail: 'someuser',
      password: true
    });

    expect(response.status).toBe(200);
  });

  it('should reject sign-in when usernameOrEmail has leading and trailing spaces', async () => {
    const response = await request(app).post('/api/user/sign-in').send({
      usernameOrEmail: ' testuser ',
      password: 'Password123!'
    });

    expect(response.status).toBe(200);
  });

  it('should reject sign-in when password has leading and trailing spaces', async () => {
    const response = await request(app).post('/api/user/sign-in').send({
      usernameOrEmail: 'testuser',
      password: ' Password123! '
    });

    expect(response.status).toBe(200);
  });

  it('should reject sign-in when the request body is empty', async () => {
    const response = await request(app).post('/api/user/sign-in').send({});

    expect(response.status).toBe(200);
  });

  it('should reject sign-in when the request body is missing', async () => {
    const response = await request(app).post('/api/user/sign-in');

    expect(response.status).toBe(200);
  });

  it('should reject sign-in when usernameOrEmail is a numeric string', async () => {
    const response = await request(app).post('/api/user/sign-in').send({
      usernameOrEmail: '12345',
      password: 'Password123!'
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: false,
      error: 'Invalid credentials'
    });
  });

  it('should reject sign-in with an uppercase email when the stored email is lowercase', async () => {
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123!',
      isVerified: true
    });

    try {
      const response = await request(app).post('/api/user/sign-in').send({
        usernameOrEmail: 'TEST@EXAMPLE.COM',
        password: 'Password123!'
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: false,
        error: 'Invalid credentials'
      });
    } finally {
      await User.deleteOne({ _id: user._id });
    }
  });

  it('should reject sign-in with an uppercase username when the stored username is lowercase', async () => {
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123!',
      isVerified: true
    });

    try {
      const response = await request(app).post('/api/user/sign-in').send({
        usernameOrEmail: 'TESTUSER',
        password: 'Password123!'
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: false,
        error: 'Invalid credentials'
      });
    } finally {
      await User.deleteOne({ _id: user._id });
    }
  });

  it('should create exactly one confirmation code for an unverified user', async () => {
    const user = await User.create({
      username: 'singleconfirmationcode',
      email: 'singleconfirmationcode@example.com',
      password: 'Password123!',
      isVerified: false
    });

    try {
      const response = await request(app).post('/api/user/sign-in').send({
        usernameOrEmail: 'singleconfirmationcode',
        password: 'Password123!'
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const confirmationCodes = await ConfirmationCode.find({
        userId: user._id,
        purpose: Purpose.PROFILE_VERIFICATION
      });

      expect(confirmationCodes).toHaveLength(1);
    } finally {
      await ConfirmationCode.deleteMany({ userId: user._id });
      await User.deleteOne({ _id: user._id });
    }
  });
});
