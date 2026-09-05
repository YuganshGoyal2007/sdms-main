import dotenv from 'dotenv';
dotenv.config();
import '../models/index.js';
import User from '../models/user.model.js';
import Coordinator from '../models/coordinator.model.js';
import Chairperson from '../models/chairperson.model.js';
import Faculty from '../models/faculty.model.js';
import Student from '../models/student.model.js';
import bcrypt from 'bcryptjs';

async function seedTestAccounts() {
  console.log('--- SEEDING/RESETTING DEDICATED E2E TEST ACCOUNTS ---');
  const testPassword = 'TestPass@123';
  const hashedPassword = await bcrypt.hash(testPassword, 10);

  // 1. Admin
  let admin = await User.findOne({ where: { role: 'admin' } });
  if (admin) {
    admin.password = hashedPassword;
    await admin.save();
    console.log(`Admin account ready: ${admin.username} / ${testPassword}`);
  }

  // 2. Coordinator
  let coordUser = await User.findOne({ where: { username: 'test_coord@gbu.ac.in' } });
  if (!coordUser) {
    coordUser = await User.create({
      username: 'test_coord@gbu.ac.in',
      password: hashedPassword,
      role: 'coordinator'
    });
  } else {
    coordUser.password = hashedPassword;
    await coordUser.save();
  }

  let coordRecord = await Coordinator.findOne({ where: { email: 'test_coord@gbu.ac.in' } });
  if (!coordRecord) {
    coordRecord = await Coordinator.create({
      userId: coordUser.id,
      coordinatorId: 'COORD_TEST_01',
      name: 'Test Coordinator',
      email: 'test_coord@gbu.ac.in',
      phone: '9876543210',
      school: 'soict',
      department: 'cse',
      program: 'btech',
      batch: '2022-26',
      specialization: 'coreseca',
      role: 'coordinator'
    });
  } else {
    coordRecord.userId = coordUser.id;
    await coordRecord.save();
  }
  console.log(`Coordinator account ready: test_coord@gbu.ac.in / ${testPassword}`);

  // 3. Chairperson
  let chairUser = await User.findOne({ where: { username: 'test_chair@gbu.ac.in' } });
  if (!chairUser) {
    chairUser = await User.create({
      username: 'test_chair@gbu.ac.in',
      password: hashedPassword,
      role: 'chairperson'
    });
  } else {
    chairUser.password = hashedPassword;
    await chairUser.save();
  }

  let chairRecord = await Chairperson.findOne({ where: { email: 'test_chair@gbu.ac.in' } });
  if (!chairRecord) {
    chairRecord = await Chairperson.create({
      userId: chairUser.id,
      chairpersonId: 'CHAIR_TEST_01',
      name: 'Test Chairperson',
      email: 'test_chair@gbu.ac.in',
      phone: '9876543211',
      school: 'soict',
      department: 'cse',
      program: 'btech',
      batch: '2022-26',
      specialization: 'coreseca'
    });
  } else {
    chairRecord.userId = chairUser.id;
    await chairRecord.save();
  }
  console.log(`Chairperson account ready: test_chair@gbu.ac.in / ${testPassword}`);

  // 4. Faculty
  let facUser = await User.findOne({ where: { username: 'test_faculty@gbu.ac.in' } });
  if (!facUser) {
    facUser = await User.create({
      username: 'test_faculty@gbu.ac.in',
      password: hashedPassword,
      role: 'faculty'
    });
  } else {
    facUser.password = hashedPassword;
    await facUser.save();
  }

  let facRecord = await Faculty.findOne({ where: { email: 'test_faculty@gbu.ac.in' } });
  if (!facRecord) {
    facRecord = await Faculty.create({
      userId: facUser.id,
      name: 'Dr. Test Faculty',
      email: 'test_faculty@gbu.ac.in',
      department: 'Computer Science and Engineering',
      designation: 'Assistant Professor'
    });
  } else {
    facRecord.userId = facUser.id;
    await facRecord.save();
  }
  console.log(`Faculty account ready: test_faculty@gbu.ac.in / ${testPassword}`);

  // 5. Student
  let studUser = await User.findOne({ where: { username: '2500100481' } });
  if (!studUser) {
    studUser = await User.create({
      username: '2500100481',
      password: hashedPassword,
      role: 'student'
    });
  } else {
    studUser.password = hashedPassword;
    await studUser.save();
  }

  let studRecord = await Student.findOne({ where: { enrollmentNo: '2500100481' } });
  if (studRecord) {
    studRecord.userId = studUser.id;
    await studRecord.save();
  }
  console.log(`Student account ready: 2500100481 / ${testPassword}`);

  console.log('All 5 test accounts ready.');
}

seedTestAccounts().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
