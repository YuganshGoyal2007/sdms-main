import { DataTypes } from 'sequelize';
import sequelize from '../lib/db.js';

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

export default AttendanceRecord;
