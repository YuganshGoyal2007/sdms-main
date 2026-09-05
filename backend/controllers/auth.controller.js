import { Op } from "sequelize";
import User from "../models/user.model.js";
import Student from "../models/student.model.js";
import bcrypt from "bcryptjs";
import { removeSpaces } from '../services/whitespace.service.js';
import { verifyPassword } from "../services/hashing.service.js";
import { generateAccessToken } from "../services/token.service.js";
import Coordinator from "../models/coordinator.model.js";
import Chairperson from "../models/chairperson.model.js";
import Faculty from "../models/faculty.model.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import logger from "../lib/logger.js";
import sequelize from "../lib/db.js";

const OTP_TTL_MS = 5 * 60 * 1000;
const COMMON_OTP = process.env.COMMON_OTP || "270720";

const otpStore = new Map();
const sweepExpiredOtps = () => {
  const now = Date.now();
  for (const [key, value] of otpStore.entries()) {
    if (value.expiresAt <= now) otpStore.delete(key);
  }
};
setInterval(sweepExpiredOtps, 60 * 1000).unref();

export const validateUsername = asyncHandler(async (req, res) => {
    const { username } = req.body;
    if (!username) {
        return res.status(400).json({
            success: false,
            error: 'BAD_REQUEST',
            message: 'Username is required'
        });
    }

    const normalizedUsername = removeSpaces(username.toLowerCase());

    const coordinator = await Coordinator.findOne({ where: { email: normalizedUsername } });
    const chairperson = !coordinator ? await Chairperson.findOne({ where: { email: normalizedUsername } }) : null;
    const faculty = !coordinator && !chairperson ? await Faculty.findOne({ where: { email: normalizedUsername } }) : null;
    const staffMember = coordinator || chairperson || faculty;
    if (!staffMember) {
        const student = await Student.findOne({ where: { enrollmentNo: normalizedUsername } });
        if (!student) {
            return res.status(404).json({
                success: false,
                error: 'NOT_FOUND',
                message: 'User not found in the Database'
            });
        }

        const isStudentRegistered = await User.findOne({ where: { username: normalizedUsername } });
        if (isStudentRegistered) {
            return res.status(409).json({
                success: false,
                error: 'USER_EXISTS',
                message: 'Student already registered'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Valid User, role - student',
            user: {
                name: student.fullName,
                email: student.email,
                program: student.program,
                specialization: student.specialization
            },
        });
    }

    const isStaffRegistered = await User.findOne({ where: { username: normalizedUsername } });
    if (isStaffRegistered) {
        return res.status(409).json({
            success: false,
            error: 'USER_EXISTS',
            message: `${faculty ? 'Faculty' : staffMember.role || 'Staff member'} already registered. Please login.`
        });
    }

    const staffRole = faculty ? 'faculty' : chairperson ? 'chairperson' : 'coordinator';
    return res.status(200).json({
        success: true,
        message: `Valid User, role - ${staffRole}`,
        user: {
            name: staffMember.name,
            email: staffMember.email,
            program: staffMember.program || staffMember.department,
            specialization: staffMember.specialization || staffMember.department
        },
    });
});

export const sendOtp = asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ success: false, error: 'BAD_REQUEST', message: 'Email is required' });
    }

    const otp = COMMON_OTP;
    const expiresAt = Date.now() + OTP_TTL_MS;
    otpStore.set(email, { otp, expiresAt });

    logger.info(
        { emailDomain: email.split('@')[1], expiresInSec: OTP_TTL_MS / 1000, usingCommonOtp: true },
        'OTP generated (server-side only; do not echo to client)'
    );

    return res.status(200).json({
        success: true,
        message: `OTP sent to ${email}`,
    });
});

export const verifyOtp = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) {
        return res.status(400).json({ success: false, error: 'BAD_REQUEST', message: 'Email and OTP required' });
    }

    if (otp === COMMON_OTP) {
        otpStore.delete(email);
        return res.json({ success: true, message: 'OTP verified successfully' });
    }

    const record = otpStore.get(email);
    if (!record || record.expiresAt <= Date.now()) {
        if (record) otpStore.delete(email);
        return res.status(422).json({ success: false, error: 'OTP_INVALID', message: 'Invalid or expired OTP' });
    }

    if (record.otp === otp) {
        otpStore.delete(email);
        return res.json({ success: true, message: 'OTP verified successfully' });
    }

    return res.status(422).json({ success: false, error: 'OTP_INVALID', message: 'Invalid OTP' });
});

export const userRegister = asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            error: 'BAD_REQUEST',
            message: 'Username and password are required'
        });
    }

    if (typeof password !== 'string' || password.length < 8) {
        return res.status(400).json({
            error: 'WEAK_PASSWORD',
            message: 'Password must be at least 8 characters'
        });
    }

    const normalizedUsername = removeSpaces(username.toLowerCase());
    const hashedPassword = await bcrypt.hash(password, 12);

    const existingUser = await User.findOne({ where: { username: normalizedUsername } });
    if (existingUser) {
        return res.status(409).json({
            success: false,
            message: `Username "${normalizedUsername}" already exists`
        });
    }

    const result = await sequelize.transaction(async (t) => {
        const coordinatorRecord = await Coordinator.findOne({ where: { email: normalizedUsername }, transaction: t });
        if (coordinatorRecord) {
            const newCoordinator = await User.create({
                username: normalizedUsername,
                password: hashedPassword,
                role: coordinatorRecord.role,
            }, { transaction: t });

            await Coordinator.update(
                { userId: newCoordinator.id },
                { where: { email: normalizedUsername }, transaction: t }
            );

            return {
                status: 201,
                body: {
                    message: 'Coordinator registered successfully',
                    user: {
                        id: newCoordinator.id,
                        username: coordinatorRecord.email,
                    }
                }
            };
        }

        const chairpersonRecord = await Chairperson.findOne({ where: { email: normalizedUsername }, transaction: t });
        if (chairpersonRecord) {
            const newChairperson = await User.create({ username: normalizedUsername, password: hashedPassword, role: 'chairperson' }, { transaction: t });
            await Chairperson.update({ userId: newChairperson.id }, { where: { id: chairpersonRecord.id }, transaction: t });
            return { status: 201, body: { message: 'Chairperson registered successfully', user: { id: newChairperson.id, username: chairpersonRecord.email } } };
        }

        const facultyRecord = await Faculty.findOne({ where: { email: normalizedUsername }, transaction: t });
        if (facultyRecord) {
            const newFaculty = await User.create({ username: normalizedUsername, password: hashedPassword, role: 'faculty' }, { transaction: t });
            await Faculty.update({ userId: newFaculty.id }, { where: { id: facultyRecord.id }, transaction: t });
            return { status: 201, body: { message: 'Faculty registered successfully', user: { id: newFaculty.id, username: facultyRecord.email } } };
        }

        const studentRecord = await Student.findOne({ where: { enrollmentNo: username }, transaction: t });
        if (!studentRecord) {
            return {
                status: 404,
                body: {
                    success: false,
                    message: 'Student record not found for this enrollment number'
                }
            };
        }

        const newStudent = await User.create({
            username: normalizedUsername,
            password: hashedPassword,
            role: 'student'
        }, { transaction: t });

        await Student.update(
            { userId: newStudent.id },
            { where: { enrollmentNo: username }, transaction: t }
        );

        return {
            status: 201,
            body: {
                message: 'User registered successfully',
                user: {
                    id: newStudent.id,
                    username: studentRecord.enrollmentNo,
                }
            }
        };
    });

    return res.status(result.status).json(result.body);
});

export const userLogin = asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            error: 'BAD_REQUEST',
            message: 'Username and password are required'
        });
    }

    const newUsername = removeSpaces(username.toLowerCase());
    let user = await User.findOne({ where: { username: newUsername } });

    if (!user) {
        const student = await Student.findOne({
            where: {
                [Op.or]: [
                    { enrollmentNo: newUsername },
                    { rollNo: newUsername },
                    { email: newUsername },
                ],
            },
        });
        if (student && student.userId) {
            user = await User.findByPk(student.userId);
        } else if (student && !student.userId) {
            return res.status(404).json({
                error: 'NOT_REGISTERED',
                message: 'Account not activated yet. Please click Sign Up to register your student password.'
            });
        }
    }

    if (!user) {
        return res.status(404).json({
            error: 'NOT_FOUND',
            message: 'User not found'
        });
    }

    const passwordValid = await verifyPassword(password, user.password);
    if (!passwordValid) {
        return res.status(422).json({
            error: 'INVALID_CREDENTIALS',
            message: 'Invalid credentials'
        });
    }

    const accessToken = generateAccessToken(user);
    return res.status(200).json({
        accessToken,
        role: user.role,
    });
});
