const router = require('express').Router();
const isAuthenticated = require('../middlewares/isAuthenticated');
const { 
    signUp,
    signIn,
    signOut,
    checkLoggedInStatus,
    checkUnique,
} = require('../controllers/user');

router.post('/sign-up', signUp);
router.post('/sign-in', signIn);
router.post('/sign-out', isAuthenticated, signOut);
router.get('/check-signed-in-status', isAuthenticated, checkLoggedInStatus);
router.get('/check-signed-in-status', isAuthenticated, checkLoggedInStatus);
router.get('/check-unique/:key/:value', checkUnique)

module.exports = router;