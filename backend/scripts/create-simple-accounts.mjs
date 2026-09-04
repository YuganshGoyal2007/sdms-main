import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import User from '../models/user.model.js';
import Student from '../models/student.model.js';

const accounts = [
    {
        username: 'student2026',
        password: 'password123',
        fullName: 'Student Batch 2026 (Cyber Security)',
        batch: '2026-30',
        specialization: 'Cyber Security Sec - A',
        school: 'soict',
        department: 'cse',
        program: 'B.Tech',
        rollNo: '2026_CYBER_TEST',
        enrollmentNo: 'EN_2026_CYBER',
    },
    {
        username: 'student2024',
        password: 'password123',
        fullName: 'Student Batch 2024 (Core Sec B)',
        batch: '2024-28',
        specialization: 'Core Sec- B',
        school: 'soict',
        department: 'cse',
        program: 'B.Tech',
        rollNo: '2024_CORE_TEST',
        enrollmentNo: 'EN_2024_CORE',
    },
    {
        username: 'student2022',
        password: 'password123',
        fullName: 'Student Batch 2022 (Core Sec A)',
        batch: '2022-26',
        specialization: 'Core Sec- A',
        school: 'soict',
        department: 'cse',
        program: 'B.Tech',
        rollNo: '2022_CORE_TEST',
        enrollmentNo: 'EN_2022_CORE',
    },
    {
        username: 'student2025',
        password: 'password123',
        fullName: 'Student Batch 2025 (AI Sec A)',
        batch: '2025-29',
        specialization: 'AI Sec-A',
        school: 'soict',
        department: 'cse',
        program: 'B.Tech',
        rollNo: '2025_AI_TEST',
        enrollmentNo: 'EN_2025_AI',
    },
];

async function createAccounts() {
    const hashedPassword = await bcrypt.hash('password123', 10);

    for (const a of accounts) {
        let user = await User.findOne({ where: { username: a.username } });
        if (!user) {
            user = await User.create({
                name: a.fullName,
                username: a.username,
                password: hashedPassword,
                role: 'student',
            });
        } else {
            user.password = hashedPassword;
            await user.save();
        }

        let student = await Student.findOne({ where: { userId: user.id } });
        if (!student) {
            student = await Student.create({
                userId: user.id,
                rollNo: a.rollNo,
                enrollmentNo: a.enrollmentNo,
                fullName: a.fullName,
                school: a.school,
                department: a.department,
                program: a.program,
                batch: a.batch,
                specialization: a.specialization,
                fatherName: 'Father',
                motherName: 'Mother',
                gender: 'Other',
                category: 'General',
                mobile: '9876543210',
                email: `${a.username}@gbu.ac.in`,
                hosteller: 'Day Scholar',
                admissionType: 'Regular',
                twelfthCompartment: 'No',
                internshipStatus: 'Not Started',
                placementStatus: 'Eligible',
                status: 'active',
                createdBy: 1,
            });
        } else {
            student.school = a.school;
            student.department = a.department;
            student.program = a.program;
            student.batch = a.batch;
            student.specialization = a.specialization;
            await student.save();
        }

        console.log(`Created/updated: ${a.username} (password: ${a.password}) -> ${a.batch} ${a.specialization}`);
    }
}

createAccounts().then(() => {
    console.log('Done!');
    process.exit(0);
}).catch((err) => {
    console.error(err);
    process.exit(1);
});
