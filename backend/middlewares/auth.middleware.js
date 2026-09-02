import jwt from "jsonwebtoken"
import User from "../models/user.model.js";
import logger from "../lib/logger.js";

const PLACEHOLDER_SECRETS = new Set([
  'your_jwt_secret',
  'your_secret_key',
  'change_me',
  'default_jwt_secret',
  'secret',
  '',
]);

const getSecret = () => {
  const secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
  if (!secret || PLACEHOLDER_SECRETS.has(secret)) {
    const err = new Error('Invalid JWT secret in environment');
    err.name = 'InvalidSecretError';
    throw err;
  }
  return secret;
};

export const isAuthenticated = async (req, res, next) => {
    const authHeader = req.headers.authorization

    if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            error: "UNAUTHENTICATED",
            message: "Missing or invalid authorization header",
        })
    }

    const token = authHeader.split(" ")[1];

    if (!token) return res.status(401).json({
        success: false,
        error: "UNAUTHENTICATED",
        message: "Missing or invalid authorization header",
    });

    try {
        const secret = getSecret();
        const decoded = jwt.verify(token, secret);
        const user = await User.findByPk(decoded.id, { attributes: { exclude: ['password'] } });
        if (!user) {
            return res.status(401).json({
                success: false,
                error: "USER_NOT_FOUND",
                message: "Authenticated user does not exist",
            });
        }
        req.user = {
            id: user.id,
            username: user.username,
            role: user.role,
            name: user.name,
            email: user.email,
        };
        next();
    } catch (err) {
        logger.warn(
            {
                requestId: req.id,
                err: { name: err.name, message: err.message },
                method: req.method,
                url: req.originalUrl,
                ip: req.ip,
            },
            'Auth middleware rejected request'
        );
        const message = err?.name === 'TokenExpiredError'
            ? 'Token has expired. Please login again.'
            : err?.name === 'JsonWebTokenError'
                ? 'Token is invalid. Please login again.'
                : 'Token validation failed. Please login again.';

        return res.status(401).json({
            success: false,
            error: err?.name || 'INVALID_TOKEN',
            message,
        });
    }
}
