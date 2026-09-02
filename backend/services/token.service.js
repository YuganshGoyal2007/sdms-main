import jwt from 'jsonwebtoken'

export const generateAccessToken = (user) => {
  const secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'default_jwt_secret';
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
    },
    secret,
    { expiresIn: process.env.ACCESS_TOKEN_EXP || '1h' }
  );
};