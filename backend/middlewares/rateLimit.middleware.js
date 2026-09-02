import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: "RATE_LIMITED", message: "Too many auth attempts, try later" }
});

export const otpLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: "RATE_LIMITED", message: "Too many OTP requests, try later" }
});

export const loginLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: "RATE_LIMITED", message: "Too many login attempts, try later" }
});
