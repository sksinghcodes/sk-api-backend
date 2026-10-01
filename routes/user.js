import express from 'express';
import isAuthenticated from '../middlewares/isAuthenticated';
import {
  signUp,
  signIn,
  signOut,
  checkLoggedInStatus,
  checkUnique,
  verifyProfile,
  getPasswordResetId,
  resetPassword
} from '../controllers/user';
import { validateSignUp, validateSignIn } from '../middlewares/validate';

const router = express.Router();

router.post('/sign-up', validateSignUp, signUp);
router.post('/sign-in', validateSignIn, signIn);
router.post('/sign-out', isAuthenticated, signOut);
router.get('/check-signed-in-status', isAuthenticated, checkLoggedInStatus);
router.get('/check-unique', checkUnique);
router.post('/verify-profile', verifyProfile);
router.get('/reset-password', getPasswordResetId);
router.post('/reset-password', resetPassword);

export default router;
