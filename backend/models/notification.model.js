import { DataTypes } from 'sequelize';
import sequelize from '../lib/db.js';

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  toRole: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'admin'
  },
  message: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  data: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  read: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  }
}, {
  timestamps: true,
});

export default Notification;
