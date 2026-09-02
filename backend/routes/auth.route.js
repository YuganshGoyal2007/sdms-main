import express from "express";
import { sendOtp, userLogin, userRegister, validateUsername, verifyOtp } from "../controllers/auth.controller.js";
import { authLimiter, otpLimiter, loginLimiter } from "../middlewares/rateLimit.middleware.js";

const router = express.Router();

router.post('/validate-username', authLimiter, validateUsername);
router.post('/user-register', authLimiter, userRegister);
router.post('/user-login', loginLimiter, userLogin);
router.post('/send-otp', otpLimiter, sendOtp);
router.post('/verify-otp', otpLimiter, verifyOtp);

export default router;
