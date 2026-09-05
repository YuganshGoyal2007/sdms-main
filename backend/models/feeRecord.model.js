import { DataTypes } from 'sequelize';
import sequelize from '../lib/db.js';
import Student from './student.model.js';

const FeeRecord = sequelize.define(
  'FeeRecord',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    rollNo: {
      type: DataTypes.STRING(40),
      allowNull: false,
    },
    academicYear: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: '2025-2026',
    },
    semester: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    feeType: {
      type: DataTypes.STRING(80),
      allowNull: false, // Tuition Fee, Hostel Fee, Exam Fee, Library Fee, Security Deposit
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    paidAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    dueAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    status: {
      type: DataTypes.ENUM('paid', 'partial', 'pending', 'overdue'),
      allowNull: false,
      defaultValue: 'pending',
    },
    dueDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    paidDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    transactionRef: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    receiptUrl: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    remarks: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    tableName: 'fee_records',
    timestamps: true,
    indexes: [
      { fields: ['studentId'] },
      { fields: ['rollNo'] },
      { fields: ['status'] },
    ],
  }
);

FeeRecord.belongsTo(Student, { foreignKey: 'studentId', as: 'student', constraints: false });
Student.hasMany(FeeRecord, { foreignKey: 'studentId', as: 'feeRecords', constraints: false });

export default FeeRecord;
