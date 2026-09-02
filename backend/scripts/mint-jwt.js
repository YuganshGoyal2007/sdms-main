import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
if (!secret) { console.error('No secret'); process.exit(1); }

// Usage: node scripts/mint-jwt.js <userId> <username> <role>
const [userId, username, role] = process.argv.slice(2);
if (!userId || !username || !role) {
  console.error('Usage: node mint-jwt.js <userId> <username> <role>');
  process.exit(1);
}

const token = jwt.sign(
  { id: Number(userId), username, role },
  secret,
  { expiresIn: '1h' }
);
console.log(token);
