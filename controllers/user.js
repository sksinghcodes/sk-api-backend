const User = require('../models/user');
const ConfirmationCode = require('../models/confirmationCode');
const { Purpose, nextTenMinutes } = require('../models/confirmationCode');
const jwt = require('jsonwebtoken');
const sendMail = require('../email/sendMail');

const setTokenOnResponse = (res, userId) => {
    const token = jwt.sign(
        {userId: userId}, 
        process.env.JWT_SECRET_KEY
    );

    res.cookie('jwt-token', token, {
        httpOnly: true,   // accessible only by web server
        secure: true,     // https
        sameSite: 'None', // cross site cookie
    })
} 

exports.signUp = (req, res) => {
    const userData = { username, email, password } = req.body;
    const newUser = new User(userData);
    const newConfirmationCode = new ConfirmationCode({
        userId: newUser._id,
        purpose: Purpose.PROFILE_VERIFICATION,
        expirationDate: nextTenMinutes(),
    });

    newUser.save()
        .then(() => newConfirmationCode.save())
        .then(() => {
            const text = `Your profile verification code is ${newConfirmationCode.code}. It will expire in next 10 minutes`;
            const html = `<p>${text}</p>`;
            return sendMail({
                receivers: [newUser.email],
                subject: 'Profile verification code',
                text: text,
                html: html,
            })
        })
        .then(() => {
            res.json({
                success: true,
                confirmationCodeId: newConfirmationCode._id,
            });
        })
        .catch(err => {
            res.json({
                success: false,
                error: err._message,
            });
        });
}

exports.signIn = (req, res) => {
    const { usernameOrEmail, password } = req.body;

    User.findOne({$or: [{username: usernameOrEmail}, {email: usernameOrEmail}]})
        .then(async user => {
            return [await user?.authenticate(password), user];
        })
        .then(([result, user]) => {
            if (user && !user.isVerified){
                const newConfirmationCode = new ConfirmationCode({
                    userId: user._id,
                    purpose: Purpose.PROFILE_VERIFICATION,
                    expirationDate: nextTenMinutes(),
                });
                newConfirmationCode.save().then(async confirmationCode => {
                    const text = `Your profile verification code is ${confirmationCode.code}. It will expire in next 10 minutes`;
                    const html = `<p>${text}</p>`;
                    return [
                        await sendMail({
                            receivers: [user.email],
                            subject: 'Profile verification code',
                            text: text,
                            html: html,
                        }),
                        confirmationCode
                    ];
                }).then(([info, confirmationCode]) => {
                    res.json({
                        success: true,
                        confirmationCodeId: confirmationCode._id,
                    });
                })
            } else if (user && user.isVerified && result) {
                setTokenOnResponse(res, user._id)
                res.json({
                    success: true,
                    message: 'Login Successful',
                });
            } else {
                res.json({
                    success: false,
                    error: 'Invalid credentials',
                });
            }
        })
        .catch(error => {
            console.log(error)
            res.json({
                success: false,
                error: error.message,
            })
        });
}

exports.getPasswordResetId = (req, res) => {
    const email = req.query.email;
    if(!email.trim()){
        res.json({
            success: false,
            error: 'Please enter email'
        })
        return;
    }

    User.findOne({email: email}).then(async user => {
        if(user) {
            const newConfirmationCode = new ConfirmationCode({
                userId: user._id,
                purpose: Purpose.PASSWORD_RESET,
                expirationDate: nextTenMinutes(),
            })
            newConfirmationCode.save().then(confirmationCode => {
                const text = `Your password reset code is ${confirmationCode.code}. It will expire in next 10 minutes`;
                const html = `<p>${text}</p>`;
                return sendMail({
                    receivers: [user.email],
                    subject: 'Code for resetting password',
                    text: text,
                    html: html,
                })
            }).then(() => {
                res.json({
                    success: true,
                    passwordResetId: newConfirmationCode._id,
                })
            }).catch(() => {
                console.log(error);
                res.json({
                    success: false,
                    error: error._message,
                })
            })

        } else {
            res.json({
                success: false,
                error: 'This email address is not used in any profile',
            })
        }
  
    }).catch(error => {
        console.log(error)
        res.json({
            success: false,
            error: error._message,
        })
    })
}

exports.resetPassword = (req, res) => {
    const { passwordResetId, code, newPassword } = req.body;
    ConfirmationCode.findById(passwordResetId).then(confirmationCode => {
        if(confirmationCode && confirmationCode.code === code && new Date(confirmationCode.expirationDate) < new Date(Date.now())){
            res.json({
                success: false,
                error: 'Profile verification code expired',
            })
        } else if (confirmationCode && confirmationCode.code === code) {
            User.findOneAndUpdate({_id: confirmationCode.userId}, {
                isVerified: true,
                password: newPassword,
            }).then(() => {
                return ConfirmationCode.findByIdAndDelete(passwordResetId)
            }).then(() => {
                res.json({
                    success: true,
                    message: 'Password reset successful',
                });
            }).catch(error => {
                console.log(error);
                res.json({
                    success: false,
                    error: error._message,
                });
            });

        } else {
            res.json({
                success: false,
                error: 'Confirmation code incorrect',
            });
        }

    }).catch(error => {
        console.log(error);
        res.json({
            success: false,
            error: error._message,
        });
    });
}

exports.verifyProfile = (req, res) => {
    console.log(req.body);
    ConfirmationCode.findOne({_id: req.body.confirmationCodeId})
    .then(confirmationCode => {
        if(confirmationCode && new Date(confirmationCode.expirationDate) < new Date(Date.now())) {
            res.json({
                success: false,
                error: 'Profile verification code expired',
            })
        } else if(
            confirmationCode &&
            confirmationCode.purpose === Purpose.PROFILE_VERIFICATION &&
            confirmationCode.code === String(req.body.code)
        ){
            ConfirmationCode.findByIdAndDelete(confirmationCode._id).then(() => {
                return User.findOneAndUpdate({_id: confirmationCode.userId}, {isVerified: true})
            }).then(() => {
                res.json({
                    success: true,
                })
            }).catch(() => {
                res.json({
                    success: false,
                    error: 'Something went wrong',
                })
            });
        } else {
            res.json({
                success: false,
                error: 'Verification code did not match',
            });
        }
    }).catch(err => {
        res.json({
            success: false,
            error: err._message,
        })
    })
}





exports.checkUnique = async (req, res) => {
    // if profile not found, return true
    // if profile found but is not verified, delete profile and return true,
    // if profile found, return false

    if(req.query.hasOwnProperty('email') || req.query.hasOwnProperty('username')){
        User.findOne(req.query).then(user => {
            if(user){
                res.json({
                    success: true,
                    isUnique: false,
                })
            } else {
                res.json({
                    success: true,
                    isUnique: true,
                })
            }
        })
    } else {
        res.json({
            success: false,
            message: 'Invalid field',
        })
    }
}

exports.checkLoggedInStatus = (req, res) => {
    User.findOne({id: req.useId})
        .select(['firstName', 'lastName', 'username', 'email', 'role'])
        .then(user => {
            res.json({
                success: true,
                user: user
            })
        })
}

exports.signOut = (req, res) => {
    res.cookie('jwt-token', '', {
        expires: new Date(0),
        httpOnly: true,
        sameSite: 'None',
        secure: true,
    }).status(200).json({
        success: true,
        message: "User sign out was successful"
    });
}