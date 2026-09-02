import { DataTypes } from 'sequelize';
import sequelize from '../lib/db.js';

const ChairpersonClass = sequelize.define('ChairpersonClass', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  chairpersonId: { type: DataTypes.INTEGER, allowNull: false },
  school: { type: DataTypes.STRING, allowNull: false },
  department: { type: DataTypes.STRING, allowNull: false },
  program: { type: DataTypes.STRING, allowNull: false },
  batch: { type: DataTypes.STRING, allowNull: false },
  specialization: { type: DataTypes.STRING, allowNull: false },
}, { timestamps: true, updatedAt: false });

export default ChairpersonClass;
