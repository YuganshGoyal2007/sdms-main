import { DataTypes } from 'sequelize';
import sequelize from '../lib/db.js';
import NoDuesApplication from './noDuesApplication.model.js';
import User from './user.model.js';

const NoDuesStage = sequelize.define(
  'NoDuesStage',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    applicationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    stageCode: {
      type: DataTypes.STRING(32),
      allowNull: false, // SCHOOL_OFFICE, HOD, DEAN, LIB, HST, LAB_SPORTS, ACC
    },
    stageName: {
      type: DataTypes.STRING(100),
      allowNull: false, // School Office, Head of Department, School Dean, Central Library, Hostel Warden, Lab & Sports, Accounts Section
    },
    verifierRole: {
      type: DataTypes.STRING(50),
      allowNull: false, // admin, chairperson, coordinator, faculty, staff
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'pending',
    },
    duesAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    comments: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    sequenceOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    verifiedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    verifiedByName: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    verifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'no_dues_stages',
    timestamps: true,
    indexes: [
      { fields: ['applicationId'] },
      { fields: ['stageCode'] },
      { fields: ['status'] },
      { fields: ['sequenceOrder'] },
    ],
  }
);

NoDuesStage.belongsTo(NoDuesApplication, { foreignKey: 'applicationId', as: 'application', constraints: false });
NoDuesApplication.hasMany(NoDuesStage, { foreignKey: 'applicationId', as: 'stages', constraints: false });
NoDuesStage.belongsTo(User, { foreignKey: 'verifiedBy', as: 'verifier', constraints: false });

export default NoDuesStage;
