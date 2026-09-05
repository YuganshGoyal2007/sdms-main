import { DataTypes } from 'sequelize';
import sequelize from '../lib/db.js';
<<<<<<< HEAD

const AttendanceRecord = sequelize.define('AttendanceRecord', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  sessionId: { type: DataTypes.INTEGER, allowNull: false },
  studentId: { type: DataTypes.INTEGER, allowNull: false },
  rollNo: { type: DataTypes.STRING, allowNull: false },
  status: {
    type: DataTypes.ENUM('present', 'absent', 'excused'),
    allowNull: false,
  },
  markedAt: { type: DataTypes.DATE, allowNull: true },
  remarks: { type: DataTypes.STRING, allowNull: true },
}, {
  timestamps: true,
  indexes: [
    {
      name: 'uniq_session_student',
      unique: true,
      fields: ['sessionId', 'studentId'],
    },
    { fields: ['studentId'] },
  ],
});
=======
import AttendanceSession from './attendanceSession.model.js';
import Student from './student.model.js';

const AttendanceRecord = sequelize.define(
  'AttendanceRecord',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    sessionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    rollNo: {
      type: DataTypes.STRING(40),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('present', 'absent', 'excused'),
      allowNull: false,
    },
    markedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    remarks: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    tableName: 'attendance_records',
    timestamps: true,
  }
);

AttendanceRecord.belongsTo(AttendanceSession, { foreignKey: 'sessionId', as: 'session', constraints: false });
AttendanceRecord.belongsTo(Student, { foreignKey: 'studentId', as: 'student', constraints: false });
>>>>>>> 95d01e0 (feat: complete SDMS audit, timetable mapping & viewer, security and database hardening)

export default AttendanceRecord;
