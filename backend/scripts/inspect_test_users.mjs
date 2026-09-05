import dotenv from 'dotenv';
dotenv.config();
import '../models/index.js';
import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';

async function checkUsers() {
  const roles = ['admin', 'coordinator', 'chairperson', 'faculty', 'student'];
  console.log('--- INSPECTING USERS FOR BROWSER WALKTHROUGH ---');

  for (const role of roles) {
    const users = await User.findAll({ where: { role }, limit: 5 });
    console.log(`\nRole: ${role.toUpperCase()} (Found ${users.length}):`);
    for (const u of users) {
      console.log(`- ID: ${u.id}, Username: ${u.username}`);
    }
  }
}

checkUsers().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
