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
        maxAge: 1000 * 60 * 60 * .25,
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
    console.log(req);
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

exports.signOut = (req, res) => {
    res.clearCookie('jwt-token');
    res.json({
        success: true,
        message: "User sign out was successful"
    });
}

exports.isAuthenticated = (req, res, next) => {
    const token = req.cookies['jwt-token'];
    console.log(req.cookies)
    jwt.verify(token, process.env.JWT_SECRET_KEY, function(err, decoded) {
        if(err) {
            res.json({
                success: false,
                error: err,
            })
        } else {
            req.userId = decoded.userId;
            next();
        }
    });
}