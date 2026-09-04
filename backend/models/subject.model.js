import { DataTypes } from 'sequelize';
import sequelize from '../lib/db.js';

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

export default Subject;
