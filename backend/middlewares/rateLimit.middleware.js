import rateLimit from "express-rate-limit";

const isDev = process.env.NODE_ENV !== "production";

export const authLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: isDev ? 1000 : 20,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => isDev,
    message: { success: false, error: "RATE_LIMITED", message: "Too many auth attempts, try later" }
});

export const otpLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: isDev ? 1000 : 5,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => isDev,
    message: { success: false, error: "RATE_LIMITED", message: "Too many OTP requests, try later" }
});

export const loginLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: isDev ? 1000 : 10,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => isDev,
    message: { success: false, error: "RATE_LIMITED", message: "Too many login attempts, try later" }
});

