const router = require('express').Router();
const isAuthenticated = require('../middlewares/isAuthenticated');
const { 
    signUp,
    signIn,
    signOut,
    checkLoggedInStatus,
    checkUnique,
} = require('../controllers/user');
const { validateSignUp, validateSignIn } = require('../middlewares/validate');

router.post('/sign-up', validateSignUp, signUp);
router.post('/sign-in', validateSignIn, signIn);
router.post('/sign-out', isAuthenticated, signOut);
router.get('/check-signed-in-status', isAuthenticated, checkLoggedInStatus);
router.get('/check-signed-in-status', isAuthenticated, checkLoggedInStatus);
router.get('/check-unique', checkUnique)

module.exports = router;