import { DataTypes } from 'sequelize';
import sequelize from '../lib/db.js';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isLowercase: true,
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('admin', 'student', 'coordinator', 'chairperson', 'faculty', 'officer'),
    defaultValue: 'student',
    allowNull: false,
  },
  officeCode: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
}, {
  timestamps: true,
});

export default User;
