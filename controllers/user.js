const User = require('../models/user');
const jwt = require('jsonwebtoken');

const setTokenOnResponse = (res, userId) => {
    const token = jwt.sign(
        {userId: userId}, 
        process.env.JWT_SECRET_KEY, 
        { expiresIn: '1h' }
    );

    res.cookie('jwt-token', token, {
        httpOnly: true,   // accessible only by web server
        secure: true,     // https
        sameSite: 'None', // cross site cookie
    })
} 

exports.signUp = (req, res) => {
    const newUser = new User(req.body);
    newUser.save()
        .then(user => {
            setTokenOnResponse(res, user._id)
            res.json({
                success: true,
                message: 'Sign up successful',
            });
        })
        .catch(err => {
            res.json({
                success: false,
                error: err,
            });
        });
}

exports.signIn = (req, res) => {
    const { usernameOrEmail, password } = req.body;
    
    User.findOne({$or: [{username: usernameOrEmail}, {email: usernameOrEmail}]})
        .then(user => {
            return [user.authenticate(password), user]
        })
        .then(([result, user]) => {
            if(result) {
                setTokenOnResponse(res, user._id)
                res.json({
                    success: true,
                    message: 'Login Successful',
                });
            } else {
                res.json({
                    success: false,
                    error: {
                        message: 'Wrong credentials'
                    },
                });
            }
        })
        .catch(error => res.json(error));
}

exports.checkUnique = (req, res) => {
    const { key, value } = req.params;
    if( key === 'username' || key === 'email' ){
        User.findOne({[key]: value}).then(user => {
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
    res.clearCookie('jwt-token');

    res.cookie('jwt-token', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    }).status(200).json({
        success: true,
        message: "User sign out was successful"
    });
}