import { DataTypes } from 'sequelize';
import sequelize from '../lib/db.js';
import User from './user.model.js';

const Faculty = sequelize.define(
  'Faculty',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: User,
        key: 'id',
      },
    },
    facultyId: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    department: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    photo: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: User,
        key: 'id',
      },
    },
  },
  {
    tableName: 'faculties',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

Faculty.belongsTo(User, { foreignKey: 'userId', as: 'user', constraints: false });
Faculty.belongsTo(User, { foreignKey: 'createdBy', as: 'creator', constraints: false });

Faculty.sync().catch((err) => {
  console.warn('Faculty table auto-sync notice:', err?.message || err);
});

export default Faculty;
