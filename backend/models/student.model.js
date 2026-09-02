import { DataTypes } from 'sequelize';
import sequelize from '../lib/db.js';
import User from './user.model.js';

const Student = sequelize.define('Student', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  rollNo: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  enrollmentNo: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  fullName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  school: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  department: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  program: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  batch: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  specialization: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  fatherName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  motherName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  gender: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  dob: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  nationalId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  mobile: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true,
    },
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  hosteller: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  enrollmentStatus: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  admissionType: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  twelfthCompartment: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  admissionYear: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  semesters: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
  },
  yearCGPA: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
  },
  internshipStatus: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  placementStatus: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  photo: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    allowNull: false,
    defaultValue: 'active',
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  updatedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  timestamps: true,
});

// Associations
Student.belongsTo(User, { foreignKey: 'userId', as: 'user', constraints: false });
Student.belongsTo(User, { foreignKey: 'createdBy', as: 'creator', constraints: false });
Student.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater', constraints: false });

export default Student;
