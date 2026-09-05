import bcrypt from "bcryptjs";
import { Op } from "sequelize";
import sequelize from "../lib/db.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import logger from "../lib/logger.js";
import User from "../models/user.model.js";
import Faculty from "../models/faculty.model.js";
import FacultyAssignment from "../models/facultyAssignment.model.js";
import Subject from "../models/subject.model.js";
import ChangeLog from "../models/changeLog.model.js";

/**
 * GET /admin/faculty
 * List all faculty members with their linked User accounts
 */
export const getFaculties = asyncHandler(async (req, res) => {
  const faculties = await Faculty.findAll({
    include: [
      { model: User, as: "user", attributes: ["id", "username", "role", "name"] },
      { model: User, as: "creator", attributes: ["id", "username", "name"] },
    ],
    order: [["name", "ASC"]],
  });

  return res.json({
    success: true,
    count: faculties.length,
    faculties,
  });
});

/**
 * POST /admin/faculty/add-faculty
 * Admin creates a new faculty member with an active user account
 * Body: { facultyId, name, email, phone, department, password? }
 */
export const addFaculty = asyncHandler(async (req, res) => {
  const { facultyId, name, email, phone, department, password } = req.body || {};

  if (!name?.trim() || !email?.trim()) {
    return res.status(422).json({
      success: false,
      message: "Name and email are required to create a faculty member.",
    });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedFacultyId = (facultyId || "").trim() || null;
  const initialPassword = password?.trim() || "faculty123";

  const transaction = await sequelize.transaction();
  try {
    // Check if user or faculty with this email already exists
    const existingUser = await User.findOne({
      where: { username: normalizedEmail },
      transaction,
    });

    if (existingUser) {
      await transaction.rollback();
      return res.status(409).json({
        success: false,
        message: `An account with email "${normalizedEmail}" already exists.`,
      });
    }

    if (normalizedFacultyId) {
      const existingFaculty = await Faculty.findOne({
        where: { facultyId: normalizedFacultyId },
        transaction,
      });
      if (existingFaculty) {
        await transaction.rollback();
        return res.status(409).json({
          success: false,
          message: `Faculty with ID "${normalizedFacultyId}" already exists.`,
        });
      }
    }

    // 1. Create User with role 'faculty'
    const hashedPassword = await bcrypt.hash(initialPassword, 12);
    const newUser = await User.create(
      {
        name: name.trim(),
        username: normalizedEmail,
        password: hashedPassword,
        role: "faculty",
      },
      { transaction }
    );

    // 2. Create Faculty profile entry
    const newFaculty = await Faculty.create(
      {
        userId: newUser.id,
        facultyId: normalizedFacultyId,
        name: name.trim(),
        email: normalizedEmail,
        phone: (phone || "").trim() || null,
        department: (department || "").trim() || null,
        createdBy: req.user.id,
      },
      { transaction }
    );

    await transaction.commit();

    await ChangeLog.create({
      userId: req.user.id,
      action: "faculty.create",
      entity: "Faculty",
      entityId: String(newFaculty.id),
      details: { facultyId: newFaculty.facultyId, email: newFaculty.email, userId: newUser.id },
    }).catch((e) => logger.warn({ err: e.message }, "ChangeLog write failed (non-fatal)"));

    logger.info({ facultyId: newFaculty.id, userId: newUser.id, createdBy: req.user.id }, "Faculty created successfully");

    return res.status(201).json({
      success: true,
      message: "Faculty created successfully.",
      faculty: newFaculty,
      user: {
        id: newUser.id,
        username: newUser.username,
        role: newUser.role,
      },
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
});

/**
 * DELETE /admin/faculty/:id
 * Delete faculty record and associated user login
 */
export const deleteFaculty = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ success: false, message: "Invalid faculty ID." });
  }

  const transaction = await sequelize.transaction();
  try {
    const faculty = await Faculty.findByPk(id, { transaction });
    if (!faculty) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: "Faculty not found." });
    }

    if (faculty.userId) {
      await User.destroy({ where: { id: faculty.userId }, transaction });
    }
    await faculty.destroy({ transaction });
    await transaction.commit();

    logger.info({ facultyId: id, deletedBy: req.user.id }, "Faculty deleted successfully");
    return res.json({ success: true, message: "Faculty deleted successfully." });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
});

/**
 * GET /faculty/me
 * Self-service details for faculty user
 */
export const getFacultyProfile = asyncHandler(async (req, res) => {
  if (!req.user || req.user.role !== "faculty") {
    return res.status(403).json({ success: false, message: "Faculty only." });
  }

  const faculty = await Faculty.findOne({
    where: {
      [Op.or]: [{ userId: req.user.id }, { email: req.user.username }],
    },
  });

  const assignments = await FacultyAssignment.findAll({
    where: { facultyId: req.user.id, isActive: true },
    order: [["semester", "ASC"]],
  });

  const subjectIds = Array.from(new Set(assignments.map((a) => a.subjectId).filter(Boolean)));
  const subjects = subjectIds.length
    ? await Subject.findAll({
        where: { id: { [Op.in]: subjectIds } },
        attributes: ["id", "name", "code", "credits", "type"],
      })
    : [];
  const subjectMap = new Map(subjects.map((s) => [s.id, s]));

  const enrichedAssignments = assignments.map((a) => {
    const subj = subjectMap.get(a.subjectId);
    return {
      id: a.id,
      subjectId: a.subjectId,
      subjectName: subj?.name || "Untitled",
      subjectCode: subj?.code || "—",
      subjectCredits: subj?.credits ?? 0,
      subjectType: subj?.type || "theory",
      teacherRole: a.teacherRole,
      school: a.school,
      department: a.department,
      program: a.program,
      batch: a.batch,
      specialization: a.specialization,
      semester: a.semester,
      academicYear: a.academicYear,
    };
  });

  const facultyData = faculty ? faculty.toJSON() : {};

  return res.json({
    success: true,
    user: {
      ...facultyData,
      id: req.user.id,
      name: faculty?.name || req.user.name || "Faculty Member",
      facultyId: faculty?.facultyId || `FAC-${req.user.id}`,
      email: faculty?.email || req.user.username,
      phone: faculty?.phone || "",
      department: faculty?.department || "",
      role: "faculty",
      createdAt: faculty?.createdAt || req.user.createdAt,
    },
    assignments: enrichedAssignments,
    totalClasses: enrichedAssignments.length,
    distinctSubjects: Array.from(new Set(enrichedAssignments.map((a) => a.subjectId))).length,
  });
});
