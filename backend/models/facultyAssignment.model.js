import { DataTypes } from 'sequelize';
import sequelize from '../lib/db.js';
import User from './user.model.js';
import Subject from './subject.model.js';

const FacultyAssignment = sequelize.define(
  'FacultyAssignment',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    facultyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    teacherRole: {
      type: DataTypes.ENUM('faculty', 'coordinator', 'chairperson'),
      allowNull: false,
    },
    subjectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
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
    semester: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    academicYear: {
      type: DataTypes.STRING(16),
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: 'faculty_assignments',
    timestamps: true,
  }
);

FacultyAssignment.belongsTo(User, { foreignKey: 'facultyId', as: 'faculty', constraints: false });
FacultyAssignment.belongsTo(User, { foreignKey: 'createdBy', as: 'creator', constraints: false });
FacultyAssignment.belongsTo(Subject, { foreignKey: 'subjectId', as: 'subject', constraints: false });

export default FacultyAssignment;
