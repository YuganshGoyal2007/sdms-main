import { DataTypes } from 'sequelize';
import sequelize from '../lib/db.js';
<<<<<<< HEAD

// classKey ('school::department::program::batch::specialization', same format
// as chairperson.controller.js) carries the class identity in the unique
// constraint so two sections of the same subject can hold attendance on the
// same date, while keeping the MySQL index under the 3072-byte key limit.
const AttendanceSession = sequelize.define('AttendanceSession', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  school: { type: DataTypes.STRING, allowNull: false },
  department: { type: DataTypes.STRING, allowNull: false },
  program: { type: DataTypes.STRING, allowNull: false },
  batch: { type: DataTypes.STRING, allowNull: false },
  specialization: { type: DataTypes.STRING, allowNull: false },
  classKey: { type: DataTypes.STRING(191), allowNull: false },
  semester: { type: DataTypes.STRING, allowNull: false },
  academicYear: { type: DataTypes.STRING, allowNull: false },
  subjectId: { type: DataTypes.INTEGER, allowNull: false },
  facultyId: { type: DataTypes.INTEGER, allowNull: false },
  // Stored as 'YYYY-MM-DD' string so date comparisons stay consistent.
  date: { type: DataTypes.STRING(10), allowNull: false },
  startTime: { type: DataTypes.STRING(5), allowNull: true },
  endTime: { type: DataTypes.STRING(5), allowNull: true },
  sessionType: {
    type: DataTypes.ENUM('lecture', 'lab', 'tutorial'),
    defaultValue: 'lecture',
    allowNull: false,
  },
  topic: { type: DataTypes.STRING, allowNull: true },
  status: {
    type: DataTypes.ENUM('draft', 'submitted', 'locked'),
    defaultValue: 'draft',
    allowNull: false,
  },
  createdBy: { type: DataTypes.INTEGER, allowNull: false },
  submittedAt: { type: DataTypes.DATE, allowNull: true },
  lockedBy: { type: DataTypes.INTEGER, allowNull: true },
  lockedAt: { type: DataTypes.DATE, allowNull: true },
  unlockedBy: { type: DataTypes.INTEGER, allowNull: true },
  unlockedAt: { type: DataTypes.DATE, allowNull: true },
  unlockReason: { type: DataTypes.TEXT, allowNull: true },
}, {
  timestamps: true,
  indexes: [
    {
      name: 'uniq_session',
      unique: true,
      fields: ['subjectId', 'classKey', 'date', 'sessionType'],
    },
    { fields: ['facultyId'] },
    { fields: ['date'] },
    { fields: ['classKey'] },
  ],
});
=======
import User from './user.model.js';
import Subject from './subject.model.js';

const AttendanceSession = sequelize.define(
  'AttendanceSession',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
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
    subjectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    facultyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    startTime: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    endTime: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    sessionType: {
      type: DataTypes.ENUM('lecture', 'lab', 'tutorial'),
      allowNull: false,
      defaultValue: 'lecture',
    },
    topic: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('draft', 'submitted', 'locked'),
      allowNull: false,
      defaultValue: 'draft',
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    submittedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    lockedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    lockedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    unlockedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    unlockedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    unlockReason: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
  },
  {
    tableName: 'attendance_sessions',
    timestamps: true,
  }
);

AttendanceSession.belongsTo(User, { foreignKey: 'facultyId', as: 'faculty', constraints: false });
AttendanceSession.belongsTo(User, { foreignKey: 'createdBy', as: 'creator', constraints: false });
AttendanceSession.belongsTo(User, { foreignKey: 'lockedBy', as: 'locker', constraints: false });
AttendanceSession.belongsTo(User, { foreignKey: 'unlockedBy', as: 'unlocker', constraints: false });
AttendanceSession.belongsTo(Subject, { foreignKey: 'subjectId', as: 'subject', constraints: false });
>>>>>>> 95d01e0 (feat: complete SDMS audit, timetable mapping & viewer, security and database hardening)

export default AttendanceSession;
