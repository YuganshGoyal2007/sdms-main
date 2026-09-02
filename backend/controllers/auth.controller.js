import User from "../models/user.model.js";
import Student from "../models/student.model.js";
import bcrypt from "bcryptjs";
import { removeSpaces } from '../services/whitespace.service.js';
import { verifyPassword } from "../services/hashing.service.js";
import { generateAccessToken } from "../services/token.service.js";
import Coordinator from "../models/coordinator.model.js";
import Chairperson from "../models/chairperson.model.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import logger from "../lib/logger.js";

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
    const staffMember = coordinator || chairperson;
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

    const isCoordinatorRegistered = await User.findOne({ where: { username: normalizedUsername } });
    if (isCoordinatorRegistered) {
        return res.status(409).json({
            success: false,
            error: 'USER_EXISTS',
            message: `${staffMember.role || 'Staff member'} already registered`
        });
    }

    return res.status(200).json({
        success: true,
        message: `Valid User, role - ${chairperson ? 'chairperson' : 'coordinator'}`,
        user: {
            name: staffMember.name,
            email: staffMember.email,
            program: staffMember.program,
            specialization: staffMember.specialization
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

    const coordinatorRecord = await Coordinator.findOne({ where: { email: normalizedUsername } });
    if (coordinatorRecord) {
        const newCoordinator = await User.create({
            username: normalizedUsername,
            password: hashedPassword,
            role: coordinatorRecord.role,
        });

        await Coordinator.update(
            { userId: newCoordinator.id },
            { where: { email: normalizedUsername } }
        );

        return res.status(201).json({
            message: 'Coordinator registered successfully',
            user: {
                id: newCoordinator.id,
                username: coordinatorRecord.email,
            }
        });
    }

    const chairpersonRecord = await Chairperson.findOne({ where: { email: normalizedUsername } });
    if (chairpersonRecord) {
        const newChairperson = await User.create({ username: normalizedUsername, password: hashedPassword, role: 'chairperson' });
        await Chairperson.update({ userId: newChairperson.id }, { where: { id: chairpersonRecord.id } });
        return res.status(201).json({ message: 'Chairperson registered successfully', user: { id: newChairperson.id, username: chairpersonRecord.email } });
    }

    const studentRecord = await Student.findOne({ where: { enrollmentNo: username } });
    if (!studentRecord) {
        return res.status(404).json({
            success: false,
            message: 'Student record not found for this enrollment number'
        });
    }

    const newStudent = await User.create({
        username: normalizedUsername,
        password: hashedPassword,
        role: 'student'
    });

    await Student.update(
        { userId: newStudent.id },
        { where: { enrollmentNo: username } }
    );

    return res.status(201).json({
        message: 'User registered successfully',
        user: {
            id: newStudent.id,
            username: studentRecord.enrollmentNo,
        }
    });
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
    const user = await User.findOne({ where: { username: newUsername } });

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
