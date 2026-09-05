import { DataTypes } from 'sequelize';
import sequelize from '../lib/db.js';
import User from './user.model.js';
import LeaveType from './leaveType.model.js';

const LeaveApplication = sequelize.define(
  'LeaveApplication',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    applicantName: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    applicantRole: {
      type: DataTypes.STRING(50),
      allowNull: false, // faculty, coordinator, chairperson, staff
    },
    department: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    school: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    leaveTypeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    fromDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    toDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    totalDays: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    attachmentUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'pending',
    },
    hodStatus: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'pending',
    },
    deanStatus: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'pending',
    },
    hodApprovedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    hodApprovedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    hodComments: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    deanApprovedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    deanApprovedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    deanComments: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'faculty_leave_applications',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['leaveTypeId'] },
      { fields: ['status'] },
      { fields: ['hodStatus'] },
      { fields: ['deanStatus'] },
    ],
  }
);

LeaveApplication.belongsTo(User, { foreignKey: 'userId', as: 'applicant', constraints: false });
LeaveApplication.belongsTo(LeaveType, { foreignKey: 'leaveTypeId', as: 'leaveType', constraints: false });
User.hasMany(LeaveApplication, { foreignKey: 'userId', as: 'leaveApplications', constraints: false });

export default LeaveApplication;
