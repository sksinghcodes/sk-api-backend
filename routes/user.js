const router = require('express').Router();
const { 
    signUp,
    signIn,
    signOut,
    isAuthenticated,
} = require('../controllers/user');

router.post('/sign-up', signUp);
router.post('/sign-in', signIn);
router.post('/sign-out', isAuthenticated, signOut);

module.exports = router;