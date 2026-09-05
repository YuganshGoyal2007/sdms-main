import { DataTypes } from 'sequelize';
import sequelize from '../lib/db.js';

const LeaveType = sequelize.define(
  'LeaveType',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    code: {
      type: DataTypes.STRING(32),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    maxDays: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10,
    },
    requiresAttachment: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: 'leave_types',
    timestamps: true,
  }
);

export default LeaveType;
