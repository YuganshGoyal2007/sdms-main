import { DataTypes } from 'sequelize';
import sequelize from '../lib/db.js';
<<<<<<< HEAD

// facultyId intentionally references users.id, NOT a separate faculties table:
// a coordinator or chairperson can also teach, so attendance ownership is tied
// to the single user identity regardless of which portal they log into.
//
// classKey is the canonical lowercase 5-field class identity
// ('school::department::program::batch::specialization', same format as
// chairperson.controller.js) kept as a column so MySQL unique indexes stay
// under the 3072-byte key limit. Duplicate-active-assignment checks are also
// enforced in the controller.
const FacultyAssignment = sequelize.define('FacultyAssignment', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  facultyId: { type: DataTypes.INTEGER, allowNull: false },
  teacherRole: {
    type: DataTypes.ENUM('faculty', 'coordinator', 'chairperson'),
    allowNull: false,
  },
  subjectId: { type: DataTypes.INTEGER, allowNull: false },
  school: { type: DataTypes.STRING, allowNull: false },
  department: { type: DataTypes.STRING, allowNull: false },
  program: { type: DataTypes.STRING, allowNull: false },
  batch: { type: DataTypes.STRING, allowNull: false },
  specialization: { type: DataTypes.STRING, allowNull: false },
  classKey: { type: DataTypes.STRING(191), allowNull: false },
  semester: { type: DataTypes.STRING, allowNull: false },
  academicYear: { type: DataTypes.STRING, allowNull: false },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true, allowNull: false },
}, {
  timestamps: true,
  indexes: [
    {
      name: 'uniq_active_assignment',
      unique: true,
      fields: ['facultyId', 'subjectId', 'classKey', 'semester', 'academicYear', 'isActive'],
    },
    { fields: ['classKey'] },
  ],
});
=======
import User from './user.model.js';
import Subject from './subject.model.js';

const FacultyAssignment = sequelize.define(
  'FacultyAssignment',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    facultyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    teacherRole: {
      type: DataTypes.ENUM('faculty', 'coordinator', 'chairperson'),
      allowNull: false,
    },
    subjectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    school: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    department: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    program: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    batch: {
      type: DataTypes.STRING(40),
      allowNull: false,
    },
    specialization: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    semester: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    academicYear: {
      type: DataTypes.STRING(16),
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: 'faculty_assignments',
    timestamps: true,
  }
);

FacultyAssignment.belongsTo(User, { foreignKey: 'facultyId', as: 'faculty', constraints: false });
FacultyAssignment.belongsTo(User, { foreignKey: 'createdBy', as: 'creator', constraints: false });
FacultyAssignment.belongsTo(Subject, { foreignKey: 'subjectId', as: 'subject', constraints: false });
>>>>>>> 95d01e0 (feat: complete SDMS audit, timetable mapping & viewer, security and database hardening)

export default FacultyAssignment;
