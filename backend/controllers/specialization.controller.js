import { Specialization } from "../models/specialization.model.js";
import Student from "../models/student.model.js";
import sequelize from "../lib/db.js";
import { asyncHandler } from "../lib/asyncHandler.js";

export const addSpecialization = asyncHandler(async (req, res) => {
  const { name, school, department, program, batch } = req.body;

  if (!name || !school || !department || !program || !batch) {
    return res.status(400).json({ success: false, message: "All fields are required" });
  }

  const existingSpecialization = await Specialization.findOne({
    where: { name, school, department, program, batch },
  });

  if (existingSpecialization) {
    return res.status(409).json({ success: false, message: "Specialization already exists" });
  }

  const savedSpecialization = await Specialization.create({
    name,
    school,
    department,
    program,
    batch,
  });

  res.status(201).json({ success: true, data: savedSpecialization });
});

export const countSpecializations = asyncHandler(async (req, res) => {
  const total = await Specialization.count();
  return res.status(200).json({ total });
});

export const viewSpecializations = asyncHandler(async (req, res) => {
  const studentCounts = await Student.findAll({
    attributes: [
      "school",
      "department",
      "program",
      "batch",
      ["specialization", "name"],
      [sequelize.fn("COUNT", sequelize.col("id")), "studentCount"],
    ],
    group: ["school", "department", "program", "batch", "specialization"],
    raw: true,
  });

  const studentCountMap = studentCounts.reduce((acc, item) => {
    const key = `${item.school}::${item.department}::${item.program}::${item.batch}::${item.name}`;
    acc[key] = Number(item.studentCount || 0);
    return acc;
  }, {});

  let specializations = await Specialization.findAll({
    order: [["batch", "DESC"], ["program", "ASC"], ["name", "ASC"]],
    raw: true,
  });

  if (!specializations.length) {
    specializations = studentCounts.map((item) => ({
      name: item.name,
      school: item.school,
      department: item.department,
      program: item.program,
      batch: item.batch,
      studentCount: Number(item.studentCount || 0),
    }));
  } else {
    specializations = specializations.map((item) => {
      const key = `${item.school}::${item.department}::${item.program}::${item.batch}::${item.name}`;
      return {
        ...item,
        studentCount: studentCountMap[key] ?? 0,
      };
    });
  }

  res.status(200).json({
    success: true,
    count: specializations.length,
    specializations,
  });
});

export const searchBatches = asyncHandler(async (req, res) => {
  const { school, department, program } = req.query;

  if (!school || !department || !program) {
    return res.status(400).json({ success: false, message: "School, department and program are required" });
  }

  let batches = await Specialization.findAll({
    where: { school, department, program },
    attributes: ["batch"],
    group: ["batch"],
    raw: true,
  });

  if (!batches.length) {
    const studentBatches = await Student.findAll({
      where: { school, department, program },
      attributes: ["batch"],
      group: ["batch"],
      raw: true,
    });
    batches = studentBatches;
  }

  res.status(200).json({
    success: true,
    batches: batches.map(item => item.batch),
  });
});

export const searchSpecialization = asyncHandler(async (req, res) => {
  const { school, department, program, batch } = req.query;

  if (!school || !department || !program || !batch) {
    return res.status(400).json({ success: false, message: "School, department, program and batch are required" });
  }

  let specializations = await Specialization.findAll({
    where: { school, department, program, batch },
    attributes: ["name"],
    raw: true,
  });

  if (!specializations.length) {
    const studentSpecializations = await Student.findAll({
      where: { school, department, program, batch },
      attributes: ["specialization"],
      group: ["specialization"],
      raw: true,
    });
    specializations = studentSpecializations.map(item => ({ name: item.specialization }));
  }

  res.status(200).json({
    success: true,
    names: specializations.map(s => s.name),
  });
});

export const deleteSpecialization = asyncHandler(async (req, res) => {
  const { name, school, department, program, batch } = req.body;

  const deletedCount = await Specialization.destroy({
    where: { name, school, department, program, batch },
  });

  if (deletedCount > 0) {
    return res.status(200).json({ success: true, deletedCount });
  }

  return res.status(404).json({
    success: false,
    message: "Specialization not found",
  });
});
