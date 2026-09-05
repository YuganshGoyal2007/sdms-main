import { DataTypes } from 'sequelize';
import sequelize from '../lib/db.js';
import Student from './student.model.js';

const NoDuesApplication = sequelize.define(
  'NoDuesApplication',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    displayId: {
      type: DataTypes.STRING(32),
      unique: true,
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
    status: {
      type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'rejected'),
      allowNull: false,
      defaultValue: 'pending',
    },
    currentStageOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    isCompleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    studentRemarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    proofDocumentUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    certificateNumber: {
      type: DataTypes.STRING(64),
      allowNull: true,
      unique: true,
    },
    certificateIssuedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'no_dues_applications',
    timestamps: true,
    indexes: [
      { fields: ['studentId'] },
      { fields: ['rollNo'] },
      { fields: ['status'] },
      { fields: ['displayId'] },
    ],
  }
);

NoDuesApplication.belongsTo(Student, { foreignKey: 'studentId', as: 'student', constraints: false });
Student.hasMany(NoDuesApplication, { foreignKey: 'studentId', as: 'noDuesApplications', constraints: false });

export default NoDuesApplication;
