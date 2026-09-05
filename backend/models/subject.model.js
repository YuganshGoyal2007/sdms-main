import { DataTypes } from 'sequelize';
import sequelize from '../lib/db.js';
<<<<<<< HEAD

const Subject = sequelize.define('Subject', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  school: { type: DataTypes.STRING, allowNull: false },
  department: { type: DataTypes.STRING, allowNull: false },
  program: { type: DataTypes.STRING, allowNull: false },
  batch: { type: DataTypes.STRING, allowNull: false },
  specialization: { type: DataTypes.STRING, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  code: { type: DataTypes.STRING, allowNull: false },
  semester: { type: DataTypes.STRING, allowNull: false },
  credits: { type: DataTypes.STRING, allowNull: true },
  type: {
    type: DataTypes.ENUM('theory', 'lab'),
    defaultValue: 'theory',
    allowNull: false,
  },
}, {
  timestamps: true,
  indexes: [
    {
      name: 'uniq_subject',
      unique: true,
      fields: ['school', 'department', 'program', 'batch', 'specialization', 'code', 'semester'],
    },
  ],
});
=======
import User from './user.model.js';

const Subject = sequelize.define(
  'Subject',
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
    name: {
      type: DataTypes.STRING(191),
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING(40),
      allowNull: false,
    },
    semester: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    credits: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM('theory', 'lab'),
      allowNull: false,
      defaultValue: 'theory',
    },
  },
  {
    tableName: 'subjects',
    timestamps: true,
  }
);
>>>>>>> 95d01e0 (feat: complete SDMS audit, timetable mapping & viewer, security and database hardening)

export default Subject;
