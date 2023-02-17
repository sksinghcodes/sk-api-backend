const User = require('../models/user');
const Verification = require('../models/verification');
const jwt = require('jsonwebtoken');

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
    const newVerification = new Verification({user: newUser._id});

    newUser.save()
        .then(user => {
            setTokenOnResponse(res, user._id)
            res.json({
                success: true,
                message: 'Sign up successful',
                verificationId: newVerification._id
            });
        })
        .catch(err => {
            console.log(err)
            res.json({
                success: false,
                error: err._message,
            });
        });
}

exports.verifyProfile = (req, res) => {

}

exports.signIn = (req, res) => {
    const { usernameOrEmail, password } = req.body;

    User.findOne({$or: [{username: usernameOrEmail}, {email: usernameOrEmail}]})
        .then(async user => {
            return [await user?.authenticate(password), user]
        })
        .then(([result, user]) => {
            if(result && user) {
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
            res.json({
                success: false,
                error: error._message,
            })
        });
}

exports.checkUnique = (req, res) => {
    // if profile not found, return true
    // if profile found but is not verified, delete profile and return true,
    // if profile found, return false

    if(req.query.hasOwnProperty('email') || req.query.hasOwnProperty('username')){
        User.findOne(req.query).then(user => {
            console.log(user)
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
    }).status(200).json({
        success: true,
        message: "User sign out was successful"
    });
}