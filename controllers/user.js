import User from '../models/user';
import ConfirmationCode from '../models/confirmationCode';
import { Purpose, nextTenMinutes } from '../models/confirmationCode';
import jwt from 'jsonwebtoken';
import sendMail from '../email/sendMail';

const setTokenOnResponse = (res, userId) => {
  const token = jwt.sign({ userId: userId }, process.env.JWT_SECRET_KEY);

  res.cookie('jwt-token', token, {
    httpOnly: true, // accessible only by web server
    secure: true, // https
    sameSite: 'None' // cross site cookie
  });
};

export const signUp = (req, res) => {
  const { username, email, password } = req.body;
  const userData = { username, email, password };
  const newUser = new User(userData);
  const newConfirmationCode = new ConfirmationCode({
    userId: newUser._id,
    purpose: Purpose.PROFILE_VERIFICATION,
    expirationDate: nextTenMinutes()
  });

  newUser
    .save()
    .then(() => newConfirmationCode.save())
    .then(() => {
      const text = `Your profile verification code is ${newConfirmationCode.code}. It will expire in next 10 minutes`;
      const html = `<p>${text}</p>`;
      return sendMail({
        receivers: [newUser.email],
        subject: 'Profile verification code',
        text: text,
        html: html
      });
    })
    .then(() => {
      res.json({
        success: true,
        confirmationCodeId: newConfirmationCode._id
      });
    })
    .catch((err) => {
      res.json({
        success: false,
        error: err.message
      });
    });
};

export const signIn = (req, res) => {
  const { usernameOrEmail, password } = req.body;

  User.findOne({
    $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }]
  })
    .then(async (user) => {
      return [await user?.authenticate(password), user];
    })
    .then(([result, user]) => {
      if (user && !user.isVerified && result) {
        const newConfirmationCode = new ConfirmationCode({
          userId: user._id,
          purpose: Purpose.PROFILE_VERIFICATION,
          expirationDate: nextTenMinutes()
        });
        return newConfirmationCode
          .save()
          .then(async (confirmationCode) => {
            const text = `Your profile verification code is ${confirmationCode.code}. It will expire in next 10 minutes`;
            const html = `<p>${text}</p>`;
            return [
              await sendMail({
                receivers: [user.email],
                subject: 'Profile verification code',
                text: text,
                html: html
              }),
              confirmationCode
            ];
          })
          .then(([info, confirmationCode]) => {
            res.json({
              success: true,
              confirmationCodeId: confirmationCode._id
            });
          });
      } else if (user && user.isVerified && result) {
        setTokenOnResponse(res, user._id);
        res.json({
          success: true,
          message: 'Login Successful'
        });
      } else {
        res.json({
          success: false,
          error: 'Invalid credentials'
        });
      }
    })
    .catch((error) => {
      console.log(error);
      res.json({
        success: false,
        error: error.message
      });
    });
};

export const getPasswordResetId = async (req, res) => {
  try {
    const email = req.query.email;
    if (!email?.trim()) {
      res.json({
        success: false,
        error: 'Please enter email'
      });
      return;
    }

    const user = await User.findOne({ email: email });

    if (!user) {
      res.json({
        success: false,
        error: 'This email address is not used in any profile'
      });
      return;
    }

    const newConfirmationCode = new ConfirmationCode({
      userId: user._id,
      purpose: Purpose.PASSWORD_RESET,
      expirationDate: nextTenMinutes()
    });

    const confirmationCode = await newConfirmationCode.save();

    const text = `Your password reset code is ${confirmationCode.code}. It will expire in next 10 minutes`;
    const html = `<p>${text}</p>`;
    await sendMail({
      receivers: [user.email],
      subject: 'Code for resetting password',
      text: text,
      html: html
    });

    res.json({
      success: true,
      passwordResetId: newConfirmationCode._id
    });

    return;
  } catch (e) {
    console.log(e);
    res.json({
      success: false,
      error: e.message
    });
    return;
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { passwordResetId, code, newPassword } = req.body;

    const confirmationCode = await ConfirmationCode.findById(passwordResetId);

    if (
      confirmationCode &&
      confirmationCode.code === code &&
      confirmationCode.purpose === Purpose.PASSWORD_RESET &&
      new Date(confirmationCode.expirationDate) < new Date(Date.now())
    ) {
      res.json({
        success: false,
        error: 'Profile verification code expired'
      });
      return;
    }

    if (
      !confirmationCode ||
      confirmationCode.code !== code ||
      confirmationCode.purpose !== Purpose.PASSWORD_RESET
    ) {
      res.json({
        success: false,
        error: 'Confirmation code incorrect'
      });
      return;
    }

    const user = await User.findOneAndUpdate(
      { _id: confirmationCode.userId },
      {
        isVerified: true,
        password: newPassword
      },
      { new: true }
    );

    if (!user) {
      res.json({
        success: false,
        error: 'User profile not found'
      });
      return;
    }

    await ConfirmationCode.findByIdAndDelete(passwordResetId);

    res.json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    console.log(error);

    res.json({
      success: false,
      error: error.message
    });
  }
};

export const verifyProfile = async (req, res) => {
  try {
    const confirmationCode = await ConfirmationCode.findOne({
      _id: req.body.verificationId
    });

    if (
      confirmationCode &&
      new Date(confirmationCode.expirationDate) < new Date(Date.now())
    ) {
      res.json({
        success: false,
        error: 'Profile verification code expired'
      });
      return;
    }

    if (
      !confirmationCode ||
      confirmationCode.purpose !== Purpose.PROFILE_VERIFICATION ||
      confirmationCode.code !== String(req.body.code)
    ) {
      res.json({
        success: false,
        error: 'Verification code did not match'
      });
      return;
    }

    const user = await User.findOneAndUpdate(
      { _id: confirmationCode.userId },
      { isVerified: true },
      { new: true }
    );

    if (!user) {
      res.json({
        success: false,
        error: 'User profile not found'
      });
      return;
    }

    await ConfirmationCode.findByIdAndDelete(confirmationCode._id);

    res.json({
      success: true
    });
  } catch (error) {
    console.log(error);

    res.json({
      success: false,
      error: error.message
    });
  }
};

export const checkUnique = async (req, res) => {
  if (
    req.query.hasOwnProperty('email') ||
    req.query.hasOwnProperty('username')
  ) {
    User.findOne(req.query).then((user) => {
      if (user) {
        res.json({
          success: true,
          isUnique: false
        });
      } else {
        res.json({
          success: true,
          isUnique: true
        });
      }
    });
  } else {
    res.json({
      success: false,
      message: 'Invalid field'
    });
  }
};

export const checkLoggedInStatus = (req, res) => {
  User.findOne({ _id: req.userId })
    .select(['username', 'email', 'role'])
    .then((user) => {
      res.json({
        success: true,
        user: user
      });
    });
};

export const signOut = (req, res) => {
  res
    .cookie('jwt-token', '', {
      expires: new Date(0),
      httpOnly: true,
      sameSite: 'None',
      secure: true
    })
    .status(200)
    .json({
      success: true,
      message: 'User sign out was successful'
    });
};
