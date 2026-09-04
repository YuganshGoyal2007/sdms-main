import { DataTypes } from 'sequelize';
import sequelize from '../lib/db.js';

/**
 * Notification = the universal inbox row for any user.
 *
 * Targeting model:
 *   - toUserId: a single User.id (personal message)        — null means role-broadcast
 *   - toRole:   'admin' | 'coordinator' | 'chairperson'    — when broadcasting to all of a role
 *
 * Only one of (toUserId, toRole) is set:
 *   - toUserId set + toRole = that user's role (read by user.api.getInbox)
 *   - toRole set + toUserId null = broadcast to that role
 */
const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  toUserId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  toRole: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
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
  },
  scope: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'direct',
    comment: 'direct | broadcast | class',
  },
  classKey: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'school|department|program|batch|specialization — set when scope=class',
  },
}, {
  timestamps: true,
  indexes: [
    { fields: ['toUserId'] },
    { fields: ['toRole'] },
    { fields: ['read'] },
    { fields: ['createdAt'] },
  ],
});

export default Notification;
